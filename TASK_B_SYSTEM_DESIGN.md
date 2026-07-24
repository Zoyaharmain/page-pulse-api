```mermaid
graph TD

A[Client] --> B[Express API]

B --> C[Input Validation (Zod)]

C --> D[Rate Limiter]

D --> E[Request ID Middleware]

E --> F[Audit Service]

F --> G[Concurrency Limiter]

G --> H[Axios HTTP Fetch]

H --> I[HTML Parser (Cheerio)]

F --> J[Redis Cache]

F --> K[Pino Logger]

F --> L[Structured JSON Response]

K --> M[Log Files]

J --> N[Cached Results]
```


