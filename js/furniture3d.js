/* ============================================================
   FORMA MOBİLYA — Gerçek 3D mobilya modelleri (Three.js)
   Işık + gölge + ahşap malzeme. Fareyle döndürülebilir.
   THREE global'i yüklenmemişse Furniture3D.available() false döner
   ve configurator SVG modele geri düşer.
   ============================================================ */

window.Furniture3D = (function () {
  "use strict";

  var instances = [];
  var rafId = null;

  function available() {
    return typeof window.THREE !== "undefined";
  }

  function loop() {
    rafId = requestAnimationFrame(loop);
    for (var i = 0; i < instances.length; i++) instances[i]._tick();
  }
  function ensureLoop() {
    if (!rafId) loop();
  }

  function classify(name) {
    var n = String(name).toLowerCase();
    if (/masa|tezg|ada|sehpa|toplant/.test(n)) return "table";
    if (/kitapl|raf|vitrin/.test(n)) return "shelf";
    if (/karyola|yatak/.test(n)) return "bed";
    if (/sandalye|tabure/.test(n)) return "seat";
    return "box";
  }

  // Rengi aç/koyulaştır (kumaş/aksan için)
  function tint(hex, pct) {
    var c = new THREE.Color(hex);
    if (pct >= 0) c.lerp(new THREE.Color(0xffffff), pct);
    else c.lerp(new THREE.Color(0x000000), -pct);
    return c;
  }

  function box(w, h, d, x, y, z, mat) {
    var m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat);
    m.position.set(x, y, z);
    m.castShadow = true;
    m.receiveShadow = true;
    return m;
  }

  // Mobilyayı tipine göre kur — taban y=0, x/z merkezli
  function buildFurniture(piece, woodMat, metalMat, fabricMat) {
    var g = new THREE.Group();
    var type = classify(piece.name);
    var W = Math.max(0.1, piece.w / 100);
    var H = Math.max(0.1, piece.h / 100);
    var D = Math.max(0.1, piece.d / 100);

    if (type === "table") {
      var slab = Math.max(0.03, H * 0.06);
      var legT = Math.max(0.04, Math.min(W, D) * 0.09);
      var legH = H - slab;
      g.add(box(W, slab, D, 0, legH + slab / 2, 0, woodMat));
      var lx = W / 2 - legT / 2 - 0.02, lz = D / 2 - legT / 2 - 0.02;
      [[-lx, -lz], [lx, -lz], [-lx, lz], [lx, lz]].forEach(function (p) {
        g.add(box(legT, legH, legT, p[0], legH / 2, p[1], woodMat));
      });
    } else if (type === "shelf") {
      var t = Math.max(0.02, Math.min(W, D) * 0.06);
      g.add(box(t, H, D, -W / 2 + t / 2, H / 2, 0, woodMat)); // sol yan
      g.add(box(t, H, D, W / 2 - t / 2, H / 2, 0, woodMat)); // sağ yan
      g.add(box(W, t, D, 0, t / 2, 0, woodMat)); // alt
      g.add(box(W, t, D, 0, H - t / 2, 0, woodMat)); // üst
      g.add(box(W - 2 * t, H, 0.012, 0, H / 2, -D / 2 + 0.01, tintMat(woodMat, -0.12))); // arka
      var n = 3;
      for (var i = 1; i <= n; i++) {
        var yy = (H * i) / (n + 1);
        g.add(box(W - 2 * t, t * 0.8, D - t, 0, yy, 0, woodMat));
      }
    } else if (type === "bed") {
      var frameH = H * 0.32;
      g.add(box(W, frameH, D, 0, frameH / 2, 0, woodMat)); // çerçeve
      g.add(box(W * 0.94, H * 0.16, D * 0.96, 0, frameH + H * 0.08, 0, fabricMat)); // şilte
      g.add(box(W, H, 0.05, 0, H / 2, -D / 2 + 0.025, woodMat)); // başlık
      g.add(box(W * 0.42, H * 0.12, D * 0.34, 0, frameH + H * 0.18, -D * 0.28, tintMat(fabricMat, 0.12))); // yastık
    } else if (type === "seat") {
      var seatY = H * 0.5;
      var st = Math.max(0.03, H * 0.05);
      var legT2 = Math.max(0.03, Math.min(W, D) * 0.08);
      g.add(box(W, st, D, 0, seatY, 0, woodMat)); // oturak
      if (!/tabure/.test(String(piece.name).toLowerCase())) {
        g.add(box(W, H - seatY, 0.04, 0, seatY + (H - seatY) / 2, -D / 2 + 0.02, woodMat)); // sırt
      }
      var sx = W / 2 - legT2 / 2 - 0.01, sz = D / 2 - legT2 / 2 - 0.01;
      [[-sx, -sz], [sx, -sz], [-sx, sz], [sx, sz]].forEach(function (p) {
        g.add(box(legT2, seatY, legT2, p[0], seatY / 2, p[1], woodMat));
      });
    } else {
      // box: gövde + kapaklar + kulplar
      g.add(box(W, H, D, 0, H / 2, 0, woodMat));
      var gap = 0.012;
      var doorW = W / 2 - gap;
      var doorH = H - 2 * gap;
      var dm = tintMat(woodMat, 0.05);
      g.add(box(doorW, doorH, 0.02, -W / 4, H / 2, D / 2 + 0.002, dm));
      g.add(box(doorW, doorH, 0.02, W / 4, H / 2, D / 2 + 0.002, dm));
      // kulplar
      var kh = Math.min(0.12, H * 0.18);
      g.add(box(0.018, kh, 0.03, -gap - 0.02, H / 2, D / 2 + 0.02, metalMat));
      g.add(box(0.018, kh, 0.03, gap + 0.02, H / 2, D / 2 + 0.02, metalMat));
    }

    return g;
  }

  function tintMat(baseMat, pct) {
    var m = baseMat.clone();
    m.color = tint(baseMat.color.getHex(), pct);
    return m;
  }

  function create(host, piece, opts) {
    opts = opts || {};
    var size = opts.size || host.clientWidth || 170;
    var hex = opts.color || "#c8a877";
    var finish = opts.finish || "melamin";

    var rough = 0.62, metal = 0.04;
    if (finish === "parlaklake") rough = 0.18;
    else if (finish === "matlake") rough = 0.4;
    else if (finish === "pvc") rough = 0.5;

    var scene = new THREE.Scene();

    var woodMat = new THREE.MeshStandardMaterial({
      color: new THREE.Color(hex),
      roughness: rough,
      metalness: metal
    });
    var metalMat = new THREE.MeshStandardMaterial({
      color: new THREE.Color(0x2b2b2b),
      roughness: 0.35,
      metalness: 0.85
    });
    var fabricMat = new THREE.MeshStandardMaterial({
      color: tint(hex, 0.35),
      roughness: 0.9,
      metalness: 0
    });

    var furniture = buildFurniture(piece, woodMat, metalMat, fabricMat);
    var pivot = new THREE.Group();
    pivot.add(furniture);
    scene.add(pivot);

    // Konumlandırma / kamera hedefi
    var bbox = new THREE.Box3().setFromObject(furniture);
    var bsize = bbox.getSize(new THREE.Vector3());
    var center = bbox.getCenter(new THREE.Vector3());
    var maxDim = Math.max(bsize.x, bsize.y, bsize.z);
    var dist = maxDim * 2.25;
    var lookY = center.y;

    // Zemin (yalnızca gölge)
    var ground = new THREE.Mesh(
      new THREE.PlaneGeometry(maxDim * 6, maxDim * 6),
      new THREE.ShadowMaterial({ opacity: 0.26 })
    );
    ground.rotation.x = -Math.PI / 2;
    ground.position.y = 0;
    ground.receiveShadow = true;
    scene.add(ground);

    // Işıklar
    scene.add(new THREE.HemisphereLight(0xffffff, 0x8d8377, 0.85));
    var key = new THREE.DirectionalLight(0xffffff, 1.05);
    key.position.set(maxDim * 2, maxDim * 3, maxDim * 2.2);
    key.castShadow = true;
    key.shadow.mapSize.set(1024, 1024);
    var s = maxDim * 1.6;
    key.shadow.camera.left = -s;
    key.shadow.camera.right = s;
    key.shadow.camera.top = s;
    key.shadow.camera.bottom = -s;
    key.shadow.camera.near = 0.1;
    key.shadow.camera.far = maxDim * 10;
    key.shadow.bias = -0.0008;
    scene.add(key);
    var fill = new THREE.DirectionalLight(0xffffff, 0.35);
    fill.position.set(-maxDim * 2, maxDim * 1.5, -maxDim);
    scene.add(fill);

    var camera = new THREE.PerspectiveCamera(38, 1, 0.05, 100);

    var renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.setSize(size, size);
    renderer.setClearColor(0x000000, 0);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    if ("outputEncoding" in renderer && THREE.sRGBEncoding) {
      renderer.outputEncoding = THREE.sRGBEncoding;
    }
    if ("toneMapping" in renderer) {
      renderer.toneMapping = THREE.ACESFilmicToneMapping;
      renderer.toneMappingExposure = 1.05;
    }
    renderer.domElement.style.width = "100%";
    renderer.domElement.style.height = "100%";
    renderer.domElement.style.display = "block";
    host.appendChild(renderer.domElement);

    var inst = {
      _azim: Math.PI * 0.28,
      _pitch: 0.95,
      _yaw: 0.5,
      _auto: true,
      _hover: false,
      _drag: false
    };

    function updateCamera() {
      var hr = dist * Math.sin(inst._pitch);
      camera.position.set(
        center.x + hr * Math.cos(inst._azim),
        center.y + dist * Math.cos(inst._pitch),
        center.z + hr * Math.sin(inst._azim)
      );
      camera.lookAt(center.x, lookY, center.z);
    }
    updateCamera();
    renderer.render(scene, camera);

    inst._tick = function () {
      if (inst._auto && !inst._drag && !inst._hover) {
        pivot.rotation.y += 0.006;
      }
      renderer.render(scene, camera);
    };

    // Döndürme etkileşimi
    var cv = renderer.domElement;
    var lastX = 0, lastY = 0;
    cv.style.touchAction = "none";
    cv.addEventListener("pointerdown", function (e) {
      e.stopPropagation();
      inst._drag = true;
      lastX = e.clientX;
      lastY = e.clientY;
      cv.setPointerCapture(e.pointerId);
    });
    cv.addEventListener("pointermove", function (e) {
      if (!inst._drag) return;
      e.stopPropagation();
      pivot.rotation.y += (e.clientX - lastX) * 0.01;
      inst._pitch = Math.max(0.18, Math.min(1.4, inst._pitch - (e.clientY - lastY) * 0.006));
      lastX = e.clientX;
      lastY = e.clientY;
      updateCamera();
    });
    function endDrag() {
      inst._drag = false;
    }
    cv.addEventListener("pointerup", endDrag);
    cv.addEventListener("pointercancel", endDrag);
    host.addEventListener("pointerenter", function () { inst._hover = true; });
    host.addEventListener("pointerleave", function () { inst._hover = false; });

    inst.setSize = function (w, h) {
      renderer.setSize(w, h || w);
      camera.aspect = (w) / (h || w);
      camera.updateProjectionMatrix();
    };

    inst.dispose = function () {
      var idx = instances.indexOf(inst);
      if (idx >= 0) instances.splice(idx, 1);
      scene.traverse(function (o) {
        if (o.geometry) o.geometry.dispose();
        if (o.material) {
          if (Array.isArray(o.material)) o.material.forEach(function (m) { m.dispose(); });
          else o.material.dispose();
        }
      });
      renderer.dispose();
      if (renderer.domElement.parentNode) {
        renderer.domElement.parentNode.removeChild(renderer.domElement);
      }
    };

    instances.push(inst);
    ensureLoop();
    return inst;
  }

  return { available: available, create: create };
})();
