/* ============================================================
   webgl-bg.js
   أضف هذا السطر قبل </body> في HTML:
   <script src="webgl-bg.js"></script>
   ============================================================ */

(function () {

    // ════════════════════════════════════════════════════════
    //  1. إنشاء الـ Canvas وإضافته للصفحة
    // ════════════════════════════════════════════════════════
    const canvas = document.createElement("canvas");
    canvas.id = "webgl-canvas";
    document.body.prepend(canvas);

    const gl = canvas.getContext("webgl", {
        alpha: false,
        antialias: false,
        depth: false,
        stencil: false,
        preserveDrawingBuffer: false,
        powerPreference: "high-performance"
    });

    if (!gl) {
        canvas.style.background = "#0a0a0f";
        console.warn("WebGL غير مدعوم في هذا المتصفح");
        return;
    }

    // ════════════════════════════════════════════════════════
    //  2. Vertex Shader (بسيط جداً)
    // ════════════════════════════════════════════════════════
    const vs = `
        attribute vec2 a;
        void main() { gl_Position = vec4(a, 0.0, 1.0); }
    `;

    // ════════════════════════════════════════════════════════
    //  3. Fragment Shader (البحر + الشمس + الألوان)
    // ════════════════════════════════════════════════════════
    const fs = `
        precision highp float;
        uniform vec2  uR;
        uniform float uT, uS, uSc, uBl;
        uniform vec3  uBg;

        #define PI 3.14159265359
        #define MARCH_STEPS 10
        #define REFINE_STEPS 3

        vec3 sCol(vec3 c0,vec3 c1,vec3 c2,vec3 c3,vec3 c4){
            int si=int(uSc); vec3 a=c0,b=c1;
            if(si==1){a=c1;b=c2;} else if(si==2){a=c2;b=c3;} else if(si==3){a=c3;b=c4;}
            return mix(a,b,uBl);
        }
        float sF(float c0,float c1,float c2,float c3,float c4){
            int si=int(uSc); float a=c0,b=c1;
            if(si==1){a=c1;b=c2;} else if(si==2){a=c2;b=c3;} else if(si==3){a=c3;b=c4;}
            return mix(a,b,uBl);
        }
        float hash(vec2 p){ return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453123); }
        float noise(vec2 p){
            vec2 i=floor(p),f=fract(p);
            f=f*f*(3.0-2.0*f);
            return mix(mix(hash(i),hash(i+vec2(1,0)),f.x),
                       mix(hash(i+vec2(0,1)),hash(i+vec2(1,1)),f.x),f.y);
        }
        float waveH(vec2 p,float t,float amp){
            float h=0.0;
            vec2 sd=normalize(vec2(1.0,0.35)); float d=dot(p,sd);
            h+=amp*0.28*sin(d*0.80+t*0.60);
            h+=amp*0.40*sin(p.x*0.70+t*0.55+p.y*0.28);
            h+=amp*0.24*sin(p.x*1.60-t*0.82+p.y*0.72);
            h+=amp*0.16*sin(p.x*3.10+t*1.15-p.y*0.50);
            h+=amp*0.10*sin(p.x*5.50-t*1.70+p.y*1.30);
            h+=amp*0.05*sin(p.x*8.60+t*2.20+p.y*1.95);
            h+=noise(p*18.0+vec2(t*0.35,t*0.12))*0.010*amp;
            return h;
        }
        vec3 waveNorm(vec2 p,float t,float amp){
            float e=0.014;
            return normalize(vec3(
                -(waveH(p+vec2(e,0),t,amp)-waveH(p-vec2(e,0),t,amp))/(2.0*e),
                1.0,
                -(waveH(p+vec2(0,e),t,amp)-waveH(p-vec2(0,e),t,amp))/(2.0*e)
            ));
        }
        void main(){
            vec2 uv=(gl_FragCoord.xy-uR*0.5)/uR.y;
            vec3 ro=vec3(sin(uT*0.07)*0.02,1.1+sin(uT*0.11)*0.01,0.0);
            vec3 rd=normalize(vec3(uv.x,uv.y-0.10,-1.4));

            vec3 skyTop =sCol(vec3(0.18,0.06,0.24),vec3(0.05,0.24,0.68),vec3(0.26,0.06,0.04),vec3(0.01,0.01,0.05),vec3(0.04,0.05,0.09));
            vec3 skyHori=sCol(vec3(0.92,0.48,0.18),vec3(0.42,0.62,0.90),vec3(0.88,0.32,0.04),vec3(0.03,0.05,0.14),vec3(0.15,0.17,0.23));
            vec3 sunCol =sCol(vec3(1.0,0.62,0.22),vec3(1.0,0.96,0.80),vec3(1.0,0.38,0.05),vec3(0.70,0.75,0.94),vec3(0.26,0.28,0.34));
            vec3 seaDeep=sCol(vec3(0.08,0.05,0.12),vec3(0.03,0.14,0.34),vec3(0.10,0.06,0.04),vec3(0.00,0.01,0.03),vec3(0.03,0.04,0.07));
            vec3 seaShlo=sCol(vec3(0.28,0.17,0.24),vec3(0.09,0.38,0.60),vec3(0.24,0.13,0.06),vec3(0.04,0.06,0.16),vec3(0.07,0.10,0.14));
            vec3 fogCol =sCol(vec3(0.80,0.50,0.30),vec3(0.58,0.72,0.90),vec3(0.70,0.28,0.05),vec3(0.02,0.03,0.08),vec3(0.12,0.14,0.18));

            float sunProgress=clamp(uS/0.58,0.0,1.0);
            float sunAngle=sunProgress*PI;
            vec3 sunDir=normalize(vec3(cos(sunAngle)*-0.75,sin(sunAngle)*0.38-0.08,-1.0));
            vec3 moonDir=normalize(vec3(-0.14,0.42,-1.0));
            float warm=smoothstep(0.22,-0.08,sunDir.y);
            sunCol=mix(sunCol,vec3(1.0,0.55,0.25),warm*0.35);

            float waveAmp=sF(0.08,0.07,0.10,0.05,0.34);
            float fogDen =sF(0.018,0.010,0.020,0.032,0.048);
            float moonAmt=sF(0.0,0.0,0.05,0.92,0.06);
            float sunAbove=step(0.0,sunDir.y);
            float sunGlow=smoothstep(-0.10,0.06,sunDir.y);

            vec3 col;
            if(rd.y<0.0){
                float tFlat=ro.y/(-rd.y),baseStep=tFlat/float(MARCH_STEPS),t=baseStep;
                for(int i=0;i<MARCH_STEPS;i++){
                    vec2 wt=ro.xz+rd.xz*t;
                    if(ro.y+rd.y*t<waveH(wt,uT,waveAmp)) break;
                    t+=baseStep;
                }
                float ta=t-baseStep,tb=t;
                for(int i=0;i<REFINE_STEPS;i++){
                    float tm=(ta+tb)*0.5;
                    vec2 wm=ro.xz+rd.xz*tm;
                    if(ro.y+rd.y*tm<waveH(wm,uT,waveAmp)) tb=tm; else ta=tm;
                }
                t=(ta+tb)*0.5;
                vec2 wp=ro.xz+rd.xz*t;
                vec3 n=waveNorm(wp,uT,waveAmp), vDir=-rd;
                float fres=pow(1.0-clamp(dot(n,vDir),0.0,1.0),4.0);
                vec3 refl=reflect(rd,n);
                float rh=clamp(refl.y,0.0,1.0);
                vec3 reflSky=mix(skyHori,skyTop,pow(rh,0.42));
                float rSun=max(dot(refl,sunDir),0.0);
                reflSky+=sunCol*pow(rSun,128.0)*2.2*sunGlow;
                reflSky+=sunCol*pow(rSun,18.0)*0.08*sunGlow;
                if(moonAmt>0.04){
                    float rM=max(dot(refl,moonDir),0.0);
                    reflSky+=vec3(0.72,0.80,0.95)*pow(rM,128.0)*0.8*moonAmt;
                }
                float depth=exp(-t*0.40);
                vec3 waterC=mix(seaDeep,seaShlo,depth*0.5);
                waterC*=mix(vec3(1.0),vec3(0.78,0.90,1.0),clamp(t*0.35,0.0,1.0));
                col=mix(waterC,reflSky,0.15+fres*0.35);
                col+=sunCol*pow(max(dot(reflect(-sunDir,n),vDir),0.0),220.0)*1.25*sunAbove;
                col+=sunCol*pow(max(dot(reflect(-sunDir,n),vDir),0.0),36.0)*0.14*sunGlow;
                col+=sunCol*pow(max(dot(refl,sunDir),0.0),10.0)*0.32*smoothstep(0.0,0.35,-rd.y)*sunGlow;
                float fog=1.0-exp(-t*fogDen);
                col=mix(col,fogCol,fog);
            } else {
                float h=clamp(rd.y,0.0,1.0);
                col=mix(skyHori,skyTop,pow(h,0.38));
            }

            float horizonW=0.008, skyMix=smoothstep(-horizonW,horizonW,rd.y);
            vec3 skyCol;
            {
                float h=clamp(rd.y,0.0,1.0);
                skyCol=mix(skyHori,skyTop,pow(h,0.38));
                float sd=max(dot(rd,sunDir),0.0);
                skyCol+=sunCol*pow(sd,420.0)*7.2*sunGlow;
                skyCol+=sunCol*pow(sd,24.0)*0.22*sunGlow;
                skyCol+=sunCol*pow(sd,5.0)*0.10*sunGlow;
                skyCol+=sunCol*smoothstep(0.9992,0.99995,dot(rd,sunDir))*2.8*sunGlow;
                skyCol+=sunCol*pow(max(dot(rd,sunDir),0.0),2.0)*0.04*sunGlow;
                skyCol+=sunCol*exp(-abs(rd.y)*24.0)*0.12*sunGlow;
                if(moonAmt>0.04){
                    float md=max(dot(rd,moonDir),0.0);
                    skyCol+=vec3(0.88,0.92,1.0)*pow(md,900.0)*8.0*moonAmt;
                    skyCol+=vec3(0.88,0.92,1.0)*pow(md,6.0)*0.05*moonAmt;
                }
            }
            col=mix(col,skyCol,skyMix);
            col=mix(fogCol,col,smoothstep(-0.008,0.018,rd.y)*0.25+0.75);
            vec2 uvV=(gl_FragCoord.xy-uR*0.5)/uR.y;
            col=mix(uBg,col,smoothstep(1.15,0.35,length(uvV)));
            col+=hash(gl_FragCoord.xy+uT*60.0)*0.004-0.002;
            gl_FragColor=vec4(clamp(col,0.0,1.0),1.0);
        }
    `;

    // ════════════════════════════════════════════════════════
    //  4. تجميع الـ Shaders
    // ════════════════════════════════════════════════════════
    const mkShader = (type, src) => {
        const s = gl.createShader(type);
        gl.shaderSource(s, src);
        gl.compileShader(s);
        if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) {
            console.error("Shader error:", gl.getShaderInfoLog(s));
            return null;
        }
        return s;
    };

    const prog = gl.createProgram();
    gl.attachShader(prog, mkShader(gl.VERTEX_SHADER, vs));
    gl.attachShader(prog, mkShader(gl.FRAGMENT_SHADER, fs));
    gl.linkProgram(prog);

    if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) {
        console.error("Program link error:", gl.getProgramInfoLog(prog));
        return;
    }

    gl.useProgram(prog);
    gl.disable(gl.DEPTH_TEST);

    const buf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1,-1, 1,-1, -1,1, 1,1]), gl.STATIC_DRAW);
    const ap = gl.getAttribLocation(prog, "a");
    gl.enableVertexAttribArray(ap);
    gl.vertexAttribPointer(ap, 2, gl.FLOAT, false, 0, 0);

    const uR   = gl.getUniformLocation(prog, "uR");
    const uTi  = gl.getUniformLocation(prog, "uT");
    const uScr = gl.getUniformLocation(prog, "uS");
    const uSc  = gl.getUniformLocation(prog, "uSc");
    const uBl  = gl.getUniformLocation(prog, "uBl");
    const uBg  = gl.getUniformLocation(prog, "uBg");

    // لون الخلفية الداكنة
    gl.uniform3f(uBg, 0.039, 0.039, 0.059);

    // ════════════════════════════════════════════════════════
    //  5. Resize — ضبط حجم الـ canvas عند تغيير النافذة
    // ════════════════════════════════════════════════════════
    let maxScroll = 1;

    const resize = () => {
       const w = window.innerWidth;
       const h = window.innerHeight;
       const isMobile = w < 768;
       const isLowEnd = navigator.hardwareConcurrency <= 4;
       const quality = isMobile ? 0.5 : isLowEnd ? 0.65 : 0.8;
       const dpr = Math.min(window.devicePixelRatio || 1, 1.0) * quality;
       canvas.width  = Math.round(w * dpr);
       canvas.height = Math.round(h * dpr);
       canvas.style.width  = w + "px";
       canvas.style.height = h + "px";
       gl.viewport(0, 0, canvas.width, canvas.height);
       gl.uniform2f(uR, canvas.width, canvas.height);
       maxScroll = Math.max(1, document.documentElement.scrollHeight - h);
};

    resize();
    window.addEventListener("resize", resize, { passive: true });
    window.addEventListener("scroll", () => {
        maxScroll = Math.max(1, document.documentElement.scrollHeight - window.innerHeight);
    }, { passive: true });

    // ════════════════════════════════════════════════════════
    //  6. حلقة الرسم الرئيسية (Animation Loop)
    //  الخلفية تتغير مع السكرول: فجر → نهار → غروب → ليل → عاصفة
    // ════════════════════════════════════════════════════════
    const N  = 5;  // عدد مراحل اليوم
    const t0 = performance.now();

    const frame = (now) => {
        requestAnimationFrame(frame);

        const scrollRatio = Math.min(window.scrollY / maxScroll, 1);
        const raw  = scrollRatio * (N - 1);
        const flr  = Math.floor(raw);
        const si   = Math.min(flr, N - 2);
        const bl   = flr >= N - 1 ? 1.0 : raw - flr;

        gl.uniform1f(uTi,  (now - t0) / 1000);
        gl.uniform1f(uScr, scrollRatio);
        gl.uniform1f(uSc,  si);
        gl.uniform1f(uBl,  bl);
        gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
    };

    requestAnimationFrame(frame);

    // ════════════════════════════════════════════════════════
    //  7. Reveal Effect — تأثير ظهور العناصر عند السكرول
    //  كل عنصر يحمل class="reveal" سيظهر بتأثير جميل
    // ════════════════════════════════════════════════════════

    // إضافة class reveal لعناصر الصفحة تلقائياً
    const autoRevealSelectors = [
        "section h1",
        "section h2",
        "section h5",
        "section p",
        "section img",
        "section button",
        "section dotlottie-player",
        ".social-links",
        "footer p"
    ];

    autoRevealSelectors.forEach(selector => {
        document.querySelectorAll(selector).forEach(el => {
            el.classList.add("reveal");
        });
    });

    // ظهور فوري لما هو في الشاشة عند التحميل
    const allReveal = document.querySelectorAll(".reveal, .glow-line");

    allReveal.forEach(el => {
        if (el.getBoundingClientRect().top < window.innerHeight * 0.92) {
            el.classList.add("visible");
        }
    });

    // مراقبة العناصر عند السكرول
    const observer = new IntersectionObserver(
        (entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add("visible");
                    observer.unobserve(entry.target);
                }
            });
        },
        { threshold: 0.08, rootMargin: "0px 0px -4% 0px" }
    );

    allReveal.forEach(el => observer.observe(el));

    // ════════════════════════════════════════════════════════
    //  ✅ جاهز! تأثير البحر مع الشمس يعمل الآن على بورتفوليوك
    // ════════════════════════════════════════════════════════

})();
