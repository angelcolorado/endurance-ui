# 🏃 EnduranceOps UI - Reglas de Inteligencia Artificial

## 🏢 Contexto del Proyecto
EnduranceOps UI es el cliente web frontend para nuestra plataforma SaaS de gestión logística de carreras de resistencia. 
Consume servicios de una arquitectura de microservicios (API Gateway) mediante HTTP.

## 🛠️ Stack Tecnológico y Arquitectura
- **Framework:** Angular 17+ (Estricto).
- **Paradigma Visual:** Tailwind CSS v3 para utilidades de clases.
- **Estado y Reactividad:** RxJS (para flujos asíncronos complejos) y Signals nativos de Angular (para el estado síncrono del componente).
- **Lenguaje:** TypeScript (Strict mode activado).

## 📜 Reglas Estrictas de Código Frontend
1. **Standalone Components:** PROHIBIDO usar `NgModules`. Todo componente, directiva o pipe debe ser `standalone: true`.
2. **Control Flow Moderno:** Usa la nueva sintaxis de plantillas de Angular (`@if`, `@for`, `@switch`). PROHIBIDO usar las directivas estructurales antiguas (`*ngIf`, `*ngFor`).
3. **Inyección de Dependencias:** Usa la función `inject()` en lugar de inyectar servicios en el constructor.
   ```typescript
   // BIEN
   private readonly authService = inject(AuthService);
   // MAL
   constructor(private authService: AuthService) {}
    ```

4. **Manejo de Formularios:** Usa EXCLUSIVAMENTE `ReactiveFormsModule` con tipado estricto (`FormGroup`, `FormControl`). Prohibido usar `FormsModule` (Template-driven forms).
5. **Estilos:** Todo el diseño debe hacerse mediante clases de Tailwind CSS en el HTML. Los archivos `.css` de los componentes deben estar vacíos o usarse solo para animaciones súper específicas (ej. `@keyframes`).
6. **Inmutabilidad:** Trata siempre los datos que provienen de las APIs como inmutables.
7. **Nombres:** Componentes en `kebab-case` para archivos, `PascalCase` para clases.
8. **Idioma:** Todo el código fuente, HTML, comentarios y mensajes de commit deben estar en **inglés**.

## ⚡ Comandos Automatizados (SOPs)

### Comando: `@wrap-ui-milestone` (Cierre de Hito UI)
Al recibir este comando, debes realizar el proceso de cierre de la tarea actual en el frontend:
1. **Auditoría de Rutas:** Revisa si se agregaron nuevas páginas y confirma que estén registradas correctamente mediante *Lazy Loading* (`loadComponent`) en `app.routes.ts`.
2. **Documentación:** Actualiza el archivo `README.md` en la raíz del proyecto. Describe las nuevas interfaces de usuario desarrolladas, la estructura de rutas, los servicios consumidos del API Gateway y cualquier decisión relevante sobre Tailwind CSS o el manejo del estado.
3. **Commit Maestro:**
    - Analiza los cambios en el *staging area* y el nombre de la rama actual (`git branch --show-current`).
    - Genera el mensaje usando *Conventional Commits* adaptado a UI.
    - **Regla estricta:** El prefijo del commit (`feat`, `fix`, `ui`, `style`) DEBE coincidir con el prefijo o la intención de la rama actual. Si la rama es `feat/login-page`, el commit debe ser `feat(auth): ...`.
4. **Salida Final:** Imprime los bloques de código necesarios para sobrescribir el `README.md`, agrega cualquier sugerencia final de refactorización visual y entrega el comando de bash `git commit ...` listo para ejecutar.