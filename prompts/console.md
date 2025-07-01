Download the React DevTools for a better development experience: https://reactjs.org/link/react-devtools
Login.tsx:65 ✅ Login - Cache de autenticação válido
Login.tsx:65 ✅ Login - Cache de autenticação válido
Login.tsx:65 ✅ Login - Cache de autenticação válido
App.tsx:231 🚨 Erro global capturado: TypeError: __privateGet(...).defaultMutationOptions is not a function
    at _a11.setOptions (@tanstack_react-query.js?v=114b4499:2651:49)
    at new _a11 (@tanstack_react-query.js?v=114b4499:2640:10)
    at @tanstack_react-query.js?v=114b4499:3396:11
    at mountState (chunk-GSKIDCVT.js?v=114b4499:12053:28)
    at Object.useState (chunk-GSKIDCVT.js?v=114b4499:12593:24)
    at Object.useState (chunk-CMM6OKGN.js?v=114b4499:1066:29)
    at useMutation (@tanstack_react-query.js?v=114b4499:3395:30)
    at useApiMutation (useApiMutation.ts:24:20)
    at UsuariosPage (index.tsx:172:28)
    at renderWithHooks (chunk-GSKIDCVT.js?v=114b4499:11596:26)
handleError @ App.tsx:231
invokeGuardedCallbackDev @ chunk-GSKIDCVT.js?v=114b4499:3705
invokeGuardedCallback @ chunk-GSKIDCVT.js?v=114b4499:3739
beginWork$1 @ chunk-GSKIDCVT.js?v=114b4499:19818
performUnitOfWork @ chunk-GSKIDCVT.js?v=114b4499:19251
workLoopConcurrent @ chunk-GSKIDCVT.js?v=114b4499:19242
renderRootConcurrent @ chunk-GSKIDCVT.js?v=114b4499:19217
performConcurrentWorkOnRoot @ chunk-GSKIDCVT.js?v=114b4499:18728
workLoop @ chunk-GSKIDCVT.js?v=114b4499:197
flushWork @ chunk-GSKIDCVT.js?v=114b4499:176
performWorkUntilDeadline @ chunk-GSKIDCVT.js?v=114b4499:384Understand this error
@tanstack_react-query.js?v=114b4499:2651 Uncaught TypeError: __privateGet(...).defaultMutationOptions is not a function
    at _a11.setOptions (@tanstack_react-query.js?v=114b4499:2651:49)
    at new _a11 (@tanstack_react-query.js?v=114b4499:2640:10)
    at @tanstack_react-query.js?v=114b4499:3396:11
    at mountState (chunk-GSKIDCVT.js?v=114b4499:12053:28)
    at Object.useState (chunk-GSKIDCVT.js?v=114b4499:12593:24)
    at Object.useState (chunk-CMM6OKGN.js?v=114b4499:1066:29)
    at useMutation (@tanstack_react-query.js?v=114b4499:3395:30)
    at useApiMutation (useApiMutation.ts:24:20)
    at UsuariosPage (index.tsx:172:28)
    at renderWithHooks (chunk-GSKIDCVT.js?v=114b4499:11596:26)
setOptions @ @tanstack_react-query.js?v=114b4499:2651
_a11 @ @tanstack_react-query.js?v=114b4499:2640
(anonymous) @ @tanstack_react-query.js?v=114b4499:3396
mountState @ chunk-GSKIDCVT.js?v=114b4499:12053
useState @ chunk-GSKIDCVT.js?v=114b4499:12593
useState @ chunk-CMM6OKGN.js?v=114b4499:1066
useMutation @ @tanstack_react-query.js?v=114b4499:3395
useApiMutation @ useApiMutation.ts:24
UsuariosPage @ index.tsx:172
renderWithHooks @ chunk-GSKIDCVT.js?v=114b4499:11596
mountIndeterminateComponent @ chunk-GSKIDCVT.js?v=114b4499:14974
beginWork @ chunk-GSKIDCVT.js?v=114b4499:15962
callCallback2 @ chunk-GSKIDCVT.js?v=114b4499:3680
invokeGuardedCallbackDev @ chunk-GSKIDCVT.js?v=114b4499:3705
invokeGuardedCallback @ chunk-GSKIDCVT.js?v=114b4499:3739
beginWork$1 @ chunk-GSKIDCVT.js?v=114b4499:19818
performUnitOfWork @ chunk-GSKIDCVT.js?v=114b4499:19251
workLoopConcurrent @ chunk-GSKIDCVT.js?v=114b4499:19242
renderRootConcurrent @ chunk-GSKIDCVT.js?v=114b4499:19217
performConcurrentWorkOnRoot @ chunk-GSKIDCVT.js?v=114b4499:18728
workLoop @ chunk-GSKIDCVT.js?v=114b4499:197
flushWork @ chunk-GSKIDCVT.js?v=114b4499:176
performWorkUntilDeadline @ chunk-GSKIDCVT.js?v=114b4499:384Understand this error
App.tsx:175 🚨 ErrorBoundary capturou erro: TypeError: __privateGet(...).defaultMutationOptions is not a function
    at _a11.setOptions (@tanstack_react-query.js?v=114b4499:2651:49)
    at new _a11 (@tanstack_react-query.js?v=114b4499:2640:10)
    at @tanstack_react-query.js?v=114b4499:3396:11
    at mountState (chunk-GSKIDCVT.js?v=114b4499:12053:28)
    at Object.useState (chunk-GSKIDCVT.js?v=114b4499:12593:24)
    at Object.useState (chunk-CMM6OKGN.js?v=114b4499:1066:29)
    at useMutation (@tanstack_react-query.js?v=114b4499:3395:30)
    at useApiMutation (useApiMutation.ts:24:20)
    at UsuariosPage (index.tsx:172:28)
    at renderWithHooks (chunk-GSKIDCVT.js?v=114b4499:11596:26)
getDerivedStateFromError @ App.tsx:175
update.payload @ chunk-GSKIDCVT.js?v=114b4499:14111
getStateFromUpdate @ chunk-GSKIDCVT.js?v=114b4499:11137
processUpdateQueue @ chunk-GSKIDCVT.js?v=114b4499:11239
updateClassInstance @ chunk-GSKIDCVT.js?v=114b4499:13976
updateClassComponent @ chunk-GSKIDCVT.js?v=114b4499:14710
beginWork @ chunk-GSKIDCVT.js?v=114b4499:15978
beginWork$1 @ chunk-GSKIDCVT.js?v=114b4499:19806
performUnitOfWork @ chunk-GSKIDCVT.js?v=114b4499:19251
workLoopConcurrent @ chunk-GSKIDCVT.js?v=114b4499:19242
renderRootConcurrent @ chunk-GSKIDCVT.js?v=114b4499:19217
performConcurrentWorkOnRoot @ chunk-GSKIDCVT.js?v=114b4499:18728
workLoop @ chunk-GSKIDCVT.js?v=114b4499:197
flushWork @ chunk-GSKIDCVT.js?v=114b4499:176
performWorkUntilDeadline @ chunk-GSKIDCVT.js?v=114b4499:384Understand this error
App.tsx:175 🚨 ErrorBoundary capturou erro: TypeError: __privateGet(...).defaultMutationOptions is not a function
    at _a11.setOptions (@tanstack_react-query.js?v=114b4499:2651:49)
    at new _a11 (@tanstack_react-query.js?v=114b4499:2640:10)
    at @tanstack_react-query.js?v=114b4499:3396:11
    at mountState (chunk-GSKIDCVT.js?v=114b4499:12053:28)
    at Object.useState (chunk-GSKIDCVT.js?v=114b4499:12593:24)
    at Object.useState (chunk-CMM6OKGN.js?v=114b4499:1066:29)
    at useMutation (@tanstack_react-query.js?v=114b4499:3395:30)
    at useApiMutation (useApiMutation.ts:24:20)
    at UsuariosPage (index.tsx:172:28)
    at renderWithHooks (chunk-GSKIDCVT.js?v=114b4499:11596:26)
getDerivedStateFromError @ App.tsx:175
update.payload @ chunk-GSKIDCVT.js?v=114b4499:14111
getStateFromUpdate @ chunk-GSKIDCVT.js?v=114b4499:11142
processUpdateQueue @ chunk-GSKIDCVT.js?v=114b4499:11239
updateClassInstance @ chunk-GSKIDCVT.js?v=114b4499:13976
updateClassComponent @ chunk-GSKIDCVT.js?v=114b4499:14710
beginWork @ chunk-GSKIDCVT.js?v=114b4499:15978
beginWork$1 @ chunk-GSKIDCVT.js?v=114b4499:19806
performUnitOfWork @ chunk-GSKIDCVT.js?v=114b4499:19251
workLoopConcurrent @ chunk-GSKIDCVT.js?v=114b4499:19242
renderRootConcurrent @ chunk-GSKIDCVT.js?v=114b4499:19217
performConcurrentWorkOnRoot @ chunk-GSKIDCVT.js?v=114b4499:18728
workLoop @ chunk-GSKIDCVT.js?v=114b4499:197
flushWork @ chunk-GSKIDCVT.js?v=114b4499:176
performWorkUntilDeadline @ chunk-GSKIDCVT.js?v=114b4499:384Understand this error
App.tsx:231 🚨 Erro global capturado: TypeError: __privateGet(...).defaultMutationOptions is not a function
    at _a11.setOptions (@tanstack_react-query.js?v=114b4499:2651:49)
    at new _a11 (@tanstack_react-query.js?v=114b4499:2640:10)
    at @tanstack_react-query.js?v=114b4499:3396:11
    at mountState (chunk-GSKIDCVT.js?v=114b4499:12053:28)
    at Object.useState (chunk-GSKIDCVT.js?v=114b4499:12593:24)
    at Object.useState (chunk-CMM6OKGN.js?v=114b4499:1066:29)
    at useMutation (@tanstack_react-query.js?v=114b4499:3395:30)
    at useApiMutation (useApiMutation.ts:24:20)
    at UsuariosPage (index.tsx:172:28)
    at renderWithHooks (chunk-GSKIDCVT.js?v=114b4499:11596:26)
handleError @ App.tsx:231
invokeGuardedCallbackDev @ chunk-GSKIDCVT.js?v=114b4499:3705
invokeGuardedCallback @ chunk-GSKIDCVT.js?v=114b4499:3739
beginWork$1 @ chunk-GSKIDCVT.js?v=114b4499:19818
performUnitOfWork @ chunk-GSKIDCVT.js?v=114b4499:19251
workLoopSync @ chunk-GSKIDCVT.js?v=114b4499:19190
renderRootSync @ chunk-GSKIDCVT.js?v=114b4499:19169
recoverFromConcurrentError @ chunk-GSKIDCVT.js?v=114b4499:18786
performConcurrentWorkOnRoot @ chunk-GSKIDCVT.js?v=114b4499:18734
workLoop @ chunk-GSKIDCVT.js?v=114b4499:197
flushWork @ chunk-GSKIDCVT.js?v=114b4499:176
performWorkUntilDeadline @ chunk-GSKIDCVT.js?v=114b4499:384Understand this error
@tanstack_react-query.js?v=114b4499:2651 Uncaught TypeError: __privateGet(...).defaultMutationOptions is not a function
    at _a11.setOptions (@tanstack_react-query.js?v=114b4499:2651:49)
    at new _a11 (@tanstack_react-query.js?v=114b4499:2640:10)
    at @tanstack_react-query.js?v=114b4499:3396:11
    at mountState (chunk-GSKIDCVT.js?v=114b4499:12053:28)
    at Object.useState (chunk-GSKIDCVT.js?v=114b4499:12593:24)
    at Object.useState (chunk-CMM6OKGN.js?v=114b4499:1066:29)
    at useMutation (@tanstack_react-query.js?v=114b4499:3395:30)
    at useApiMutation (useApiMutation.ts:24:20)
    at UsuariosPage (index.tsx:172:28)
    at renderWithHooks (chunk-GSKIDCVT.js?v=114b4499:11596:26)
setOptions @ @tanstack_react-query.js?v=114b4499:2651
_a11 @ @tanstack_react-query.js?v=114b4499:2640
(anonymous) @ @tanstack_react-query.js?v=114b4499:3396
mountState @ chunk-GSKIDCVT.js?v=114b4499:12053
useState @ chunk-GSKIDCVT.js?v=114b4499:12593
useState @ chunk-CMM6OKGN.js?v=114b4499:1066
useMutation @ @tanstack_react-query.js?v=114b4499:3395
useApiMutation @ useApiMutation.ts:24
UsuariosPage @ index.tsx:172
renderWithHooks @ chunk-GSKIDCVT.js?v=114b4499:11596
mountIndeterminateComponent @ chunk-GSKIDCVT.js?v=114b4499:14974
beginWork @ chunk-GSKIDCVT.js?v=114b4499:15962
callCallback2 @ chunk-GSKIDCVT.js?v=114b4499:3680
invokeGuardedCallbackDev @ chunk-GSKIDCVT.js?v=114b4499:3705
invokeGuardedCallback @ chunk-GSKIDCVT.js?v=114b4499:3739
beginWork$1 @ chunk-GSKIDCVT.js?v=114b4499:19818
performUnitOfWork @ chunk-GSKIDCVT.js?v=114b4499:19251
workLoopSync @ chunk-GSKIDCVT.js?v=114b4499:19190
renderRootSync @ chunk-GSKIDCVT.js?v=114b4499:19169
recoverFromConcurrentError @ chunk-GSKIDCVT.js?v=114b4499:18786
performConcurrentWorkOnRoot @ chunk-GSKIDCVT.js?v=114b4499:18734
workLoop @ chunk-GSKIDCVT.js?v=114b4499:197
flushWork @ chunk-GSKIDCVT.js?v=114b4499:176
performWorkUntilDeadline @ chunk-GSKIDCVT.js?v=114b4499:384Understand this error
App.tsx:175 🚨 ErrorBoundary capturou erro: TypeError: __privateGet(...).defaultMutationOptions is not a function
    at _a11.setOptions (@tanstack_react-query.js?v=114b4499:2651:49)
    at new _a11 (@tanstack_react-query.js?v=114b4499:2640:10)
    at @tanstack_react-query.js?v=114b4499:3396:11
    at mountState (chunk-GSKIDCVT.js?v=114b4499:12053:28)
    at Object.useState (chunk-GSKIDCVT.js?v=114b4499:12593:24)
    at Object.useState (chunk-CMM6OKGN.js?v=114b4499:1066:29)
    at useMutation (@tanstack_react-query.js?v=114b4499:3395:30)
    at useApiMutation (useApiMutation.ts:24:20)
    at UsuariosPage (index.tsx:172:28)
    at renderWithHooks (chunk-GSKIDCVT.js?v=114b4499:11596:26)
getDerivedStateFromError @ App.tsx:175
update.payload @ chunk-GSKIDCVT.js?v=114b4499:14111
getStateFromUpdate @ chunk-GSKIDCVT.js?v=114b4499:11137
processUpdateQueue @ chunk-GSKIDCVT.js?v=114b4499:11239
updateClassInstance @ chunk-GSKIDCVT.js?v=114b4499:13976
updateClassComponent @ chunk-GSKIDCVT.js?v=114b4499:14710
beginWork @ chunk-GSKIDCVT.js?v=114b4499:15978
beginWork$1 @ chunk-GSKIDCVT.js?v=114b4499:19806
performUnitOfWork @ chunk-GSKIDCVT.js?v=114b4499:19251
workLoopSync @ chunk-GSKIDCVT.js?v=114b4499:19190
renderRootSync @ chunk-GSKIDCVT.js?v=114b4499:19169
recoverFromConcurrentError @ chunk-GSKIDCVT.js?v=114b4499:18786
performConcurrentWorkOnRoot @ chunk-GSKIDCVT.js?v=114b4499:18734
workLoop @ chunk-GSKIDCVT.js?v=114b4499:197
flushWork @ chunk-GSKIDCVT.js?v=114b4499:176
performWorkUntilDeadline @ chunk-GSKIDCVT.js?v=114b4499:384Understand this error
App.tsx:175 🚨 ErrorBoundary capturou erro: TypeError: __privateGet(...).defaultMutationOptions is not a function
    at _a11.setOptions (@tanstack_react-query.js?v=114b4499:2651:49)
    at new _a11 (@tanstack_react-query.js?v=114b4499:2640:10)
    at @tanstack_react-query.js?v=114b4499:3396:11
    at mountState (chunk-GSKIDCVT.js?v=114b4499:12053:28)
    at Object.useState (chunk-GSKIDCVT.js?v=114b4499:12593:24)
    at Object.useState (chunk-CMM6OKGN.js?v=114b4499:1066:29)
    at useMutation (@tanstack_react-query.js?v=114b4499:3395:30)
    at useApiMutation (useApiMutation.ts:24:20)
    at UsuariosPage (index.tsx:172:28)
    at renderWithHooks (chunk-GSKIDCVT.js?v=114b4499:11596:26)
getDerivedStateFromError @ App.tsx:175
update.payload @ chunk-GSKIDCVT.js?v=114b4499:14111
getStateFromUpdate @ chunk-GSKIDCVT.js?v=114b4499:11142
processUpdateQueue @ chunk-GSKIDCVT.js?v=114b4499:11239
updateClassInstance @ chunk-GSKIDCVT.js?v=114b4499:13976
updateClassComponent @ chunk-GSKIDCVT.js?v=114b4499:14710
beginWork @ chunk-GSKIDCVT.js?v=114b4499:15978
beginWork$1 @ chunk-GSKIDCVT.js?v=114b4499:19806
performUnitOfWork @ chunk-GSKIDCVT.js?v=114b4499:19251
workLoopSync @ chunk-GSKIDCVT.js?v=114b4499:19190
renderRootSync @ chunk-GSKIDCVT.js?v=114b4499:19169
recoverFromConcurrentError @ chunk-GSKIDCVT.js?v=114b4499:18786
performConcurrentWorkOnRoot @ chunk-GSKIDCVT.js?v=114b4499:18734
workLoop @ chunk-GSKIDCVT.js?v=114b4499:197
flushWork @ chunk-GSKIDCVT.js?v=114b4499:176
performWorkUntilDeadline @ chunk-GSKIDCVT.js?v=114b4499:384Understand this error
chunk-GSKIDCVT.js?v=114b4499:14080 The above error occurred in the <UsuariosPage> component:

    at UsuariosPage (http://localhost:8080/src/pages/admin/usuarios/index.tsx?t=1751380882572:96:36)
    at RenderedRoute (http://localhost:8080/node_modules/.vite/deps/react-router-dom.js?v=114b4499:4088:5)
    at Routes (http://localhost:8080/node_modules/.vite/deps/react-router-dom.js?v=114b4499:4558:5)
    at O (http://localhost:8080/node_modules/.vite/deps/next-themes.js?v=114b4499:23:25)
    at z (http://localhost:8080/node_modules/.vite/deps/next-themes.js?v=114b4499:21:18)
    at RenderedRoute (http://localhost:8080/node_modules/.vite/deps/react-router-dom.js?v=114b4499:4088:5)
    at Outlet (http://localhost:8080/node_modules/.vite/deps/react-router-dom.js?v=114b4499:4494:26)
    at ForceAuth (http://localhost:8080/src/components/Auth/ForceAuth.tsx:52:33)
    at RenderedRoute (http://localhost:8080/node_modules/.vite/deps/react-router-dom.js?v=114b4499:4088:5)
    at Routes (http://localhost:8080/node_modules/.vite/deps/react-router-dom.js?v=114b4499:4558:5)
    at ChatbotProvider (http://localhost:8080/src/contexts/ChatbotContext.tsx:20:35)
    at Router (http://localhost:8080/node_modules/.vite/deps/react-router-dom.js?v=114b4499:4501:15)
    at BrowserRouter (http://localhost:8080/node_modules/.vite/deps/react-router-dom.js?v=114b4499:5247:5)
    at QueryClientProvider (http://localhost:8080/node_modules/.vite/deps/@tanstack_react-query.js?v=114b4499:2933:3)
    at AuthSimpleProvider (http://localhost:8080/src/modules/usuarios-permissoes/components/AuthSimpleProvider.tsx:19:38)
    at ErrorBoundary (http://localhost:8080/src/App.tsx?t=1751380882572:183:5)
    at App (http://localhost:8080/src/App.tsx?t=1751380882572:248:9)

React will try to recreate this component tree from scratch using the error boundary you provided, ErrorBoundary.
logCapturedError @ chunk-GSKIDCVT.js?v=114b4499:14080
callback @ chunk-GSKIDCVT.js?v=114b4499:14126
callCallback @ chunk-GSKIDCVT.js?v=114b4499:11296
commitUpdateQueue @ chunk-GSKIDCVT.js?v=114b4499:11313
commitLayoutEffectOnFiber @ chunk-GSKIDCVT.js?v=114b4499:17123
commitLayoutMountEffects_complete @ chunk-GSKIDCVT.js?v=114b4499:18030
commitLayoutEffects_begin @ chunk-GSKIDCVT.js?v=114b4499:18019
commitLayoutEffects @ chunk-GSKIDCVT.js?v=114b4499:17970
commitRootImpl @ chunk-GSKIDCVT.js?v=114b4499:19406
commitRoot @ chunk-GSKIDCVT.js?v=114b4499:19330
finishConcurrentRender @ chunk-GSKIDCVT.js?v=114b4499:18813
performConcurrentWorkOnRoot @ chunk-GSKIDCVT.js?v=114b4499:18768
workLoop @ chunk-GSKIDCVT.js?v=114b4499:197
flushWork @ chunk-GSKIDCVT.js?v=114b4499:176
performWorkUntilDeadline @ chunk-GSKIDCVT.js?v=114b4499:384Understand this error
App.tsx:180 🚨 ErrorBoundary - Detalhes do erro: {error: '__privateGet(...).defaultMutationOptions is not a function', stack: 'TypeError: __privateGet(...).defaultMutationOption….vite/deps/chunk-GSKIDCVT.js?v=114b4499:11596:26)', componentStack: '\n    at UsuariosPage (http://localhost:8080/src/pa…localhost:8080/src/App.tsx?t=1751380882572:248:9)'}
componentDidCatch @ App.tsx:180
callback @ chunk-GSKIDCVT.js?v=114b4499:14132
callCallback @ chunk-GSKIDCVT.js?v=114b4499:11296
commitUpdateQueue @ chunk-GSKIDCVT.js?v=114b4499:11313
commitLayoutEffectOnFiber @ chunk-GSKIDCVT.js?v=114b4499:17123
commitLayoutMountEffects_complete @ chunk-GSKIDCVT.js?v=114b4499:18030
commitLayoutEffects_begin @ chunk-GSKIDCVT.js?v=114b4499:18019
commitLayoutEffects @ chunk-GSKIDCVT.js?v=114b4499:17970
commitRootImpl @ chunk-GSKIDCVT.js?v=114b4499:19406
commitRoot @ chunk-GSKIDCVT.js?v=114b4499:19330
finishConcurrentRender @ chunk-GSKIDCVT.js?v=114b4499:18813
performConcurrentWorkOnRoot @ chunk-GSKIDCVT.js?v=114b4499:18768
workLoop @ chunk-GSKIDCVT.js?v=114b4499:197
flushWork @ chunk-GSKIDCVT.js?v=114b4499:176
performWorkUntilDeadline @ chunk-GSKIDCVT.js?v=114b4499:384Understand this error