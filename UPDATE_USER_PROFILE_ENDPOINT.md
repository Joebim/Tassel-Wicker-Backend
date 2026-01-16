# Update User Profile API

**Endpoint**: `PATCH /api/users/me`

Allows an authenticated user to update their own profile information and preferences.

## Authentication

- **Type**: Bearer Token
- **Header**: `Authorization: Bearer <token>`

## Request Body

The request body should be a JSON object conforming to the following schema. All fields are optional; only provided fields will be updated.

### Schema

```typescript
interface UpdateUserProfileRequest {
  firstName?: string; // Min 1, Max 120 chars
  lastName?: string; // Min 1, Max 120 chars
  phone?: string; // Min 3, Max 40 chars
  preferences?: UserPreferences;
}

interface UserPreferences {
  newsletter?: boolean;
  marketing?: boolean;
  currency?: string; // e.g., "USD", "GBP"
  language?: string; // e.g., "en", "es"
}
```

### Example Request

```json
{
  "firstName": "Jane",
  "phone": "+15550199",
  "preferences": {
    "newsletter": true,
    "currency": "GBP"
  }
}
```

## Response

### Success (200 OK)

Returns the updated user object wrapped in an `item` property.

```json
{
  "item": {
    "id": "651a2b3c...",
    "email": "jane.doe@example.com",
    "firstName": "Jane",
    "lastName": "Doe",
    "phone": "+15550199",
    "role": "customer",
    "isEmailVerified": true,
    "addresses": [], // List of addresses
    "preferences": {
      "newsletter": true,
      "marketing": false,
      "currency": "GBP",
      "language": "en"
    },
    "createdAt": "2024-01-01T10:00:00.000Z",
    "updatedAt": "2024-01-26T14:30:00.000Z"
  }
}
```

### Errors

| Status Code          | Code           | Description                                                             |
| :------------------- | :------------- | :---------------------------------------------------------------------- |
| **400 Bad Request**  | `BadRequest`   | Validation failed (e.g., firstName is empty string).                    |
| **401 Unauthorized** | `Unauthorized` | Invalid or missing authentication token.                                |
| **404 Not Found**    | `NotFound`     | User record not found (rare, implies deleted account with valid token). |
