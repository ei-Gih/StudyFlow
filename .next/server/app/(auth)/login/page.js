(()=>{var e={};e.id=665,e.ids=[665],e.modules={72934:e=>{"use strict";e.exports=require("next/dist/client/components/action-async-storage.external.js")},54580:e=>{"use strict";e.exports=require("next/dist/client/components/request-async-storage.external.js")},45869:e=>{"use strict";e.exports=require("next/dist/client/components/static-generation-async-storage.external.js")},20399:e=>{"use strict";e.exports=require("next/dist/compiled/next-server/app-page.runtime.prod.js")},27790:e=>{"use strict";e.exports=require("assert")},78893:e=>{"use strict";e.exports=require("buffer")},84770:e=>{"use strict";e.exports=require("crypto")},17702:e=>{"use strict";e.exports=require("events")},32615:e=>{"use strict";e.exports=require("http")},35240:e=>{"use strict";e.exports=require("https")},86624:e=>{"use strict";e.exports=require("querystring")},17360:e=>{"use strict";e.exports=require("url")},21764:e=>{"use strict";e.exports=require("util")},71568:e=>{"use strict";e.exports=require("zlib")},5097:(e,r,a)=>{"use strict";a.r(r),a.d(r,{GlobalError:()=>i.a,__next_app__:()=>u,originalPathname:()=>p,pages:()=>c,routeModule:()=>m,tree:()=>l}),a(67190),a(35866),a(68739);var t=a(23191),s=a(88716),o=a(37922),i=a.n(o),n=a(95231),d={};for(let e in n)0>["default","tree","pages","GlobalError","originalPathname","__next_app__","routeModule"].indexOf(e)&&(d[e]=()=>n[e]);a.d(r,d);let l=["",{children:["(auth)",{children:["login",{children:["__PAGE__",{},{page:[()=>Promise.resolve().then(a.bind(a,67190)),"C:\\Users\\Gatinha\\Documents\\GitHub\\StudyFlow\\app\\(auth)\\login\\page.tsx"]}]},{}]},{"not-found":[()=>Promise.resolve().then(a.t.bind(a,35866,23)),"next/dist/client/components/not-found-error"]}]},{layout:[()=>Promise.resolve().then(a.bind(a,68739)),"C:\\Users\\Gatinha\\Documents\\GitHub\\StudyFlow\\app\\layout.tsx"],"not-found":[()=>Promise.resolve().then(a.t.bind(a,35866,23)),"next/dist/client/components/not-found-error"]}],c=["C:\\Users\\Gatinha\\Documents\\GitHub\\StudyFlow\\app\\(auth)\\login\\page.tsx"],p="/(auth)/login/page",u={require:a,loadChunk:()=>Promise.resolve()},m=new t.AppPageRouteModule({definition:{kind:s.x.APP_PAGE,page:"/(auth)/login/page",pathname:"/login",bundlePath:"",filename:"",appPaths:[]},userland:{loaderTree:l}})},7014:(e,r,a)=>{Promise.resolve().then(a.bind(a,75595))},45880:(e,r,a)=>{Promise.resolve().then(a.bind(a,41713))},52951:(e,r,a)=>{Promise.resolve().then(a.t.bind(a,12994,23)),Promise.resolve().then(a.t.bind(a,96114,23)),Promise.resolve().then(a.t.bind(a,9727,23)),Promise.resolve().then(a.t.bind(a,79671,23)),Promise.resolve().then(a.t.bind(a,41868,23)),Promise.resolve().then(a.t.bind(a,84759,23))},75595:(e,r,a)=>{"use strict";a.r(r),a.d(r,{default:()=>d});var t=a(10326),s=a(17577),o=a(77109),i=a(35047),n=a(90434);function d(){let e=(0,i.useRouter)(),[r,a]=(0,s.useState)(""),[d,l]=(0,s.useState)(""),[c,p]=(0,s.useState)(null),[u,m]=(0,s.useState)(!1),[x,b]=(0,s.useState)(!1);async function g(a){a.preventDefault(),p(null),m(!0);try{let a=await (0,o.signIn)("credentials",{email:r,password:d,redirect:!1});if(a?.error){p("Email ou senha incorretos.");return}e.replace("/dashboard"),e.refresh()}catch{p("Ocorreu um erro. Tente novamente.")}finally{m(!1)}}async function h(){b(!0),await (0,o.signIn)("google",{callbackUrl:"/dashboard"})}return(0,t.jsxs)(t.Fragment,{children:[t.jsx("style",{children:`
        @import url('https://fonts.googleapis.com/css2?family=Sora:wght@300;400;600;700&family=DM+Mono:wght@400;500&display=swap');

        .auth-root {
          --bg: #0e0f11;
          --surface: #16181c;
          --surface2: #1e2026;
          --border: #2a2d35;
          --text: #e8eaf0;
          --muted: #6b7280;
          --accent: #a3e635;
          font-family: 'Sora', sans-serif;
          background: var(--bg);
          color: var(--text);
          min-height: 100vh;
          display: grid;
          grid-template-columns: 1fr 1fr;
        }

        @media (max-width: 768px) {
          .auth-root { grid-template-columns: 1fr; }
          .auth-brand { display: none !important; }
        }

        /* ── Brand panel ── */
        .auth-brand {
          background: var(--surface);
          border-right: 1px solid var(--border);
          display: flex;
          flex-direction: column;
          justify-content: center;
          padding: 60px 56px;
          position: relative;
          overflow: hidden;
        }
        .brand-grid {
          position: absolute; inset: 0;
          background-image:
            linear-gradient(rgba(163,230,53,0.03) 1px, transparent 1px),
            linear-gradient(90deg, rgba(163,230,53,0.03) 1px, transparent 1px);
          background-size: 40px 40px;
        }
        .brand-content { position: relative; z-index: 1; }
        .brand-logo {
          display: flex; align-items: center; gap: 10px;
          font-size: 22px; font-weight: 700;
          color: var(--accent); margin-bottom: 48px;
          letter-spacing: -0.5px;
        }
        .brand-logo-dot {
          width: 10px; height: 10px;
          background: var(--accent); border-radius: 50%;
          animation: pulse 2s ease-in-out infinite;
        }
        @keyframes pulse { 0%,100%{opacity:1;transform:scale(1)} 50%{opacity:.5;transform:scale(1.5)} }

        .brand-headline {
          font-size: 36px; font-weight: 700;
          line-height: 1.2; letter-spacing: -1px;
          margin-bottom: 16px;
        }
        .brand-headline span { color: var(--accent); }
        .brand-sub { font-size: 15px; color: var(--muted); line-height: 1.6; max-width: 360px; margin-bottom: 48px; }

        .brand-features { display: flex; flex-direction: column; gap: 12px; }
        .brand-feature {
          display: flex; align-items: center; gap: 12px;
          font-size: 13px; color: var(--muted);
        }
        .feature-dot {
          width: 6px; height: 6px; border-radius: 50%;
          background: var(--accent); flex-shrink: 0;
        }

        .brand-stats {
          display: grid; grid-template-columns: repeat(3,1fr);
          gap: 16px; margin-top: 48px;
        }
        .brand-stat {
          background: var(--surface2);
          border: 1px solid var(--border);
          border-radius: 10px; padding: 14px 16px;
        }
        .brand-stat-val {
          font-family: 'DM Mono', monospace;
          font-size: 22px; font-weight: 500;
          color: var(--accent);
        }
        .brand-stat-lbl { font-size: 11px; color: var(--muted); margin-top: 2px; }

        /* ── Form panel ── */
        .auth-form-panel {
          display: flex; align-items: center; justify-content: center;
          padding: 40px 24px;
        }
        .auth-card {
          width: 100%; max-width: 400px;
          animation: fadeUp 0.4s ease both;
        }
        @keyframes fadeUp { from{opacity:0;transform:translateY(16px)} to{opacity:1;transform:none} }

        .auth-title { font-size: 26px; font-weight: 700; letter-spacing: -0.5px; margin-bottom: 6px; }
        .auth-subtitle { font-size: 13px; color: var(--muted); margin-bottom: 32px; }
        .auth-subtitle a { color: var(--accent); text-decoration: none; font-weight: 600; }
        .auth-subtitle a:hover { text-decoration: underline; }

        /* Demo banner */
        .demo-banner {
          background: rgba(163,230,53,0.06);
          border: 1px solid rgba(163,230,53,0.2);
          border-radius: 10px; padding: 12px 14px;
          display: flex; align-items: center; justify-content: space-between;
          margin-bottom: 20px; font-size: 12px;
        }
        .demo-info { color: var(--muted); }
        .demo-info strong { color: var(--text); }
        .demo-btn {
          background: rgba(163,230,53,0.12); color: var(--accent);
          border: 1px solid rgba(163,230,53,0.25);
          border-radius: 6px; padding: 5px 12px;
          font-size: 11px; font-weight: 600;
          cursor: pointer; transition: all 0.15s;
          font-family: 'Sora', sans-serif;
        }
        .demo-btn:hover { background: rgba(163,230,53,0.2); }

        /* Form elements */
        .form-group { margin-bottom: 16px; }
        .form-label { font-size: 12px; font-weight: 600; color: var(--muted); margin-bottom: 7px; display: block; text-transform: uppercase; letter-spacing: 0.5px; }
        .form-input {
          width: 100%; padding: 12px 14px;
          background: var(--surface2); border: 1px solid var(--border);
          border-radius: 10px; color: var(--text);
          font-family: 'Sora', sans-serif; font-size: 14px;
          outline: none; transition: border-color 0.2s;
          box-sizing: border-box;
        }
        .form-input:focus { border-color: var(--accent); }
        .form-input::placeholder { color: var(--muted); }
        .form-input.error { border-color: #f87171; }

        .forgot-link {
          display: block; text-align: right;
          font-size: 12px; color: var(--muted);
          text-decoration: none; margin-top: -8px; margin-bottom: 16px;
        }
        .forgot-link:hover { color: var(--text); }

        .error-msg {
          background: rgba(248,113,113,0.1);
          border: 1px solid rgba(248,113,113,0.25);
          border-radius: 8px; padding: 10px 14px;
          font-size: 13px; color: #f87171;
          margin-bottom: 16px;
        }

        .submit-btn {
          width: 100%; padding: 13px;
          background: var(--accent); color: #0e0f11;
          border: none; border-radius: 10px;
          font-family: 'Sora', sans-serif;
          font-size: 14px; font-weight: 700;
          cursor: pointer; transition: all 0.15s;
          display: flex; align-items: center; justify-content: center; gap: 8px;
          margin-bottom: 12px;
        }
        .submit-btn:hover:not(:disabled) { transform: translateY(-1px); box-shadow: 0 4px 20px rgba(163,230,53,0.3); }
        .submit-btn:disabled { opacity: 0.6; cursor: not-allowed; transform: none; }

        .divider {
          display: flex; align-items: center; gap: 12px;
          margin: 16px 0; font-size: 11px; color: var(--muted);
        }
        .divider::before, .divider::after {
          content: ''; flex: 1; height: 1px; background: var(--border);
        }

        .google-btn {
          width: 100%; padding: 12px;
          background: var(--surface2); color: var(--text);
          border: 1px solid var(--border); border-radius: 10px;
          font-family: 'Sora', sans-serif;
          font-size: 13px; font-weight: 500;
          cursor: pointer; transition: all 0.15s;
          display: flex; align-items: center; justify-content: center; gap: 10px;
        }
        .google-btn:hover:not(:disabled) { border-color: #3a3d45; background: #1a1c20; }
        .google-btn:disabled { opacity: 0.6; cursor: not-allowed; }

        .spinner {
          width: 16px; height: 16px;
          border: 2px solid rgba(0,0,0,0.2);
          border-top-color: #0e0f11;
          border-radius: 50%;
          animation: spin 0.7s linear infinite;
        }
        @keyframes spin { to { transform: rotate(360deg); } }

        .google-icon {
          width: 18px; height: 18px; flex-shrink: 0;
        }
      `}),(0,t.jsxs)("div",{className:"auth-root",children:[(0,t.jsxs)("div",{className:"auth-brand",children:[t.jsx("div",{className:"brand-grid"}),(0,t.jsxs)("div",{className:"brand-content",children:[(0,t.jsxs)("div",{className:"brand-logo",children:[t.jsx("div",{className:"brand-logo-dot"}),"StudyFlow"]}),(0,t.jsxs)("div",{className:"brand-headline",children:["Estude com ",t.jsx("span",{children:"m\xe9todo"}),",",t.jsx("br",{}),"evolua com ",t.jsx("span",{children:"dados"}),"."]}),t.jsx("div",{className:"brand-sub",children:"Planos de estudo, pomodoro, flashcards com revis\xe3o espa\xe7ada, gamifica\xe7\xe3o e analytics — tudo em um lugar."}),t.jsx("div",{className:"brand-features",children:["Revis\xe3o espa\xe7ada estilo Anki integrada","Timer pomodoro com rastreamento de XP","Dashboard com progresso em tempo real","Sugest\xf5es inteligentes baseadas no seu ritmo","Streak di\xe1rio e sistema de conquistas"].map(e=>(0,t.jsxs)("div",{className:"brand-feature",children:[t.jsx("div",{className:"feature-dot"}),e]},e))}),(0,t.jsxs)("div",{className:"brand-stats",children:[(0,t.jsxs)("div",{className:"brand-stat",children:[t.jsx("div",{className:"brand-stat-val",children:"SM-2"}),t.jsx("div",{className:"brand-stat-lbl",children:"Algoritmo"})]}),(0,t.jsxs)("div",{className:"brand-stat",children:[t.jsx("div",{className:"brand-stat-val",children:"+10"}),t.jsx("div",{className:"brand-stat-lbl",children:"XP por tarefa"})]}),(0,t.jsxs)("div",{className:"brand-stat",children:[t.jsx("div",{className:"brand-stat-val",children:"∞"}),t.jsx("div",{className:"brand-stat-lbl",children:"Planos"})]})]})]})]}),t.jsx("div",{className:"auth-form-panel",children:(0,t.jsxs)("div",{className:"auth-card",children:[t.jsx("div",{className:"auth-title",children:"Entrar"}),(0,t.jsxs)("div",{className:"auth-subtitle",children:["N\xe3o tem conta?"," ",t.jsx(n.default,{href:"/register",children:"Criar agora — \xe9 gr\xe1tis"})]}),(0,t.jsxs)("div",{className:"demo-banner",children:[(0,t.jsxs)("div",{className:"demo-info",children:[t.jsx("strong",{children:"Conta demo"})," dispon\xedvel para testar"]}),t.jsx("button",{className:"demo-btn",onClick:function(){a("demo@studyflow.app"),l("demo1234")},children:"Preencher"})]}),c&&t.jsx("div",{className:"error-msg",children:c}),(0,t.jsxs)("form",{onSubmit:g,children:[(0,t.jsxs)("div",{className:"form-group",children:[t.jsx("label",{className:"form-label",children:"Email"}),t.jsx("input",{type:"email",className:`form-input${c?" error":""}`,placeholder:"seu@email.com",value:r,onChange:e=>a(e.target.value),required:!0,autoComplete:"email"})]}),(0,t.jsxs)("div",{className:"form-group",children:[t.jsx("label",{className:"form-label",children:"Senha"}),t.jsx("input",{type:"password",className:`form-input${c?" error":""}`,placeholder:"••••••••",value:d,onChange:e=>l(e.target.value),required:!0,autoComplete:"current-password"})]}),t.jsx(n.default,{href:"/forgot-password",className:"forgot-link",children:"Esqueci minha senha"}),t.jsx("button",{type:"submit",className:"submit-btn",disabled:u,children:u?t.jsx("div",{className:"spinner"}):"Entrar"})]}),t.jsx("div",{className:"divider",children:"ou"}),(0,t.jsxs)("button",{className:"google-btn",onClick:h,disabled:x,children:[x?t.jsx("div",{className:"spinner",style:{borderTopColor:"#e8eaf0"}}):(0,t.jsxs)("svg",{className:"google-icon",viewBox:"0 0 24 24",children:[t.jsx("path",{fill:"#4285F4",d:"M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"}),t.jsx("path",{fill:"#34A853",d:"M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"}),t.jsx("path",{fill:"#FBBC05",d:"M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"}),t.jsx("path",{fill:"#EA4335",d:"M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"})]}),"Continuar com Google"]})]})})]})]})}},41713:(e,r,a)=>{"use strict";a.d(r,{default:()=>o});var t=a(10326),s=a(77109);function o({children:e,session:r}){return t.jsx(s.SessionProvider,{session:r,children:e})}},67190:(e,r,a)=>{"use strict";a.r(r),a.d(r,{default:()=>t});let t=(0,a(68570).createProxy)(String.raw`C:\Users\Gatinha\Documents\GitHub\StudyFlow\app\(auth)\login\page.tsx#default`)},68739:(e,r,a)=>{"use strict";a.r(r),a.d(r,{default:()=>u,metadata:()=>p});var t=a(19510),s=a(56476),o=a.n(s),i=a(73741),n=a.n(i),d=a(75571),l=a(90455);let c=(0,a(68570).createProxy)(String.raw`C:\Users\Gatinha\Documents\GitHub\StudyFlow\components\SessionProvider.tsx#default`);a(67272);let p={title:{default:"StudyFlow",template:"%s — StudyFlow"},description:"Plataforma avan\xe7ada de gerenciamento de estudos com pomodoro, flashcards e analytics.",keywords:["estudos","pomodoro","flashcards","revis\xe3o espa\xe7ada","produtividade"],authors:[{name:"StudyFlow"}],openGraph:{title:"StudyFlow",description:"Estude com m\xe9todo, evolua com dados.",type:"website"}};async function u({children:e}){let r=await (0,d.getServerSession)(l.L);return t.jsx("html",{lang:"pt-BR",className:`${o().variable} ${n().variable}`,children:t.jsx("body",{children:t.jsx(c,{session:r,children:e})})})}},90455:(e,r,a)=>{"use strict";a.d(r,{L:()=>p});var t=a(75571),s=a.n(t),o=a(53797),i=a(77234),n=a(13539),d=a(42023),l=a.n(d),c=a(83493);let p={adapter:(0,n.N)(c._),providers:[(0,i.Z)({clientId:process.env.GOOGLE_CLIENT_ID,clientSecret:process.env.GOOGLE_CLIENT_SECRET}),(0,o.Z)({name:"credentials",credentials:{email:{label:"Email",type:"email"},password:{label:"Senha",type:"password"}},async authorize(e){if(!e?.email||!e?.password)return null;let r=await c._.user.findUnique({where:{email:e.email}});return r&&r.passwordHash&&await l().compare(e.password,r.passwordHash)?{id:r.id,name:r.name,email:r.email}:null}})],session:{strategy:"jwt"},callbacks:{jwt:async({token:e,user:r})=>(r&&(e.id=r.id),e),session:async({session:e,token:r})=>(r&&e.user&&(e.user.id=r.id),e)},pages:{signIn:"/login",error:"/login"},secret:process.env.NEXTAUTH_SECRET};s()(p)},83493:(e,r,a)=>{"use strict";a.d(r,{_:()=>s});let t=require("@prisma/client"),s=globalThis.prisma??new t.PrismaClient({log:["error"]})},67272:()=>{}};var r=require("../../../webpack-runtime.js");r.C(e);var a=e=>r(r.s=e),t=r.X(0,[999,829,496],()=>a(5097));module.exports=t})();