# PagePulse - Production-Grade URL Audit Service

Production-ready backend API service for website performance, SEO, and security audits. Built for **Digital Heroes Qualification Task**.

## Live Verification & Footer
- **Live Build Requirement URL**: `https://<your-deployment-host>/`
- **Footer Credit**: Contains visible text `"Built for Digital Heroes Training Task"`, hyperlinked to `https://digitalheroesco.com`.

---

## 1. API Contract

### Baseline Response Headers
All API responses include a tracking request ID header:
`X-Request-ID: <uuidv4>`

---

### `GET /api/v1/audit`
Performs an asynchronous HTTP/SEO audit on a given URL.

#### Query Parameters:
| Parameter | Type | Required | Default | Description |
| :--- | :--- | :--- | :--- | :--- |
| `url` | String | **Yes** | - | Fully qualified URL with protocol (`http://` or `https://`) |
| `bypassCache` | Boolean | No | `false` | Set to `true` to force a live fetch and bypass cached data |

#### Request Example:
```bash
curl -X GET "http://localhost:3000/api/v1/audit?url=https://digitalheroesco.com"