# Backend for OdinBook Project

A restful api created to for the OdinBook Project

### Authentication

Attach JWT to header as Bearer token

```
Authorization: Bearer <Token>
```

### Response

Response will always be in following format

```
{success: boolean, message?: if applicable, error?: if applicable, ...additionalData?: if applicable}
```

API

| Method | Route            | Description                        | Body Format               |
| ------ | ---------------- | ---------------------------------- | ------------------------- |
| POST   | /requests        | Send a request to another user     | {to: <ID of target user>} |
| POST   | /requests/accept | Accept a request from another user | {from: <ID of requester>} |