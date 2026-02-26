# Security Triage & SAST Baseline

## Semgrep en el Pipeline de CI/CD

Hemos instrumentado `semgrep ci` en Github Actions de manera persistente (PRs, y Scheduled Semanal) usando las reglas oficiales `p/default`, `p/security-audit` y `p/typescript`.

### Políticas

1. **High / Critical Findings**: Rompen la carga del build pipeline (Gate Fails). El Merge queda bloqueado.
2. **Medium / Low Findings**: Generan un warning. El ingeniero de DevOps / SecOps debe revisarlos durante el ciclo de Code Review.

### Cómo Triagear Falsos Positivos (Ruido)

Dado que Semgrep es agresivo con código asíncrono y variables ANY, los falsos positivos deben ser excluidos del baseline para evitar fatiga de alertas.

Uso del comentario `// nosemgrep`:
Si un ingeniero detecta que una estructura (como un objeto inyectado o evaluado de `request.user`) dispara alertas de "Type Unsafety" pero se sabe que es controlado por Middleware, deberá ignorar la línea:

```typescript
// nosemgrep: typescript.react.security.audit.react-props-injection
const role = user.projectRole || user.role;
```

O si aplica a un bloque completo y se aprueba como riesgoso/aceptado, agregar al archivo `.semgrepignore` el patrón o carpeta. No uses `.semgrepignore` para relajar la seguridad sistemáticamente, consúltalo con el tech lead.
