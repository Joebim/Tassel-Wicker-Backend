# Admin User Management API

This document details the API endpoints for managing users as an Admin or Moderator.

## Authentication

All endpoints described here require authentication and specific roles.

- **Type**: Bearer Token
- **Header**: `Authorization: Bearer <token>`

---

## 1. List Users

- **Endpoint**: `GET /api/users`
- **Roles Required**: `admin`, `moderator`
- **Description**: Returns a paginated list of all users. Supports filtering by role and searching by text.

### Query Parameters

| Parameter | Type    | Default | Description                                             |
| :-------- | :------ | :------ | :------------------------------------------------------ |
| `page`    | Integer | `1`     | Page number for pagination.                             |
| `limit`   | Integer | `20`    | Number of items per page (Max 100).                     |
| `search`  | String  | -       | Search text (matches email, first name, last name).     |
| `role`    | String  | -       | Filter by user role (`admin`, `customer`, `moderator`). |

### Response Example (200 OK)

```json
{
  "items": [
    {
      "id": "651a2b3c...",
      "email": "user@example.com",
      "firstName": "John",
      "lastName": "Doe",
      "role": "customer",
      "isEmailVerified": true,
      "createdAt": "2024-01-15T12:00:00.000Z",
      "updatedAt": "2024-01-15T12:00:00.000Z"
    }
  ],
  "page": 1,
  "limit": 20,
  "total": 50,
  "totalPages": 3
}
```

---

## 2. Get User by ID

- **Endpoint**: `GET /api/users/:id`
- **Roles Required**: `admin`, `moderator`
- **Description**: Retrieves details of a specific user by their MongoDB ID.

### Path Parameters

| Parameter | Type   | Required | Description                 |
| :-------- | :----- | :------- | :-------------------------- |
| `id`      | String | Yes      | The MongoDB ID of the user. |

### Response Example (200 OK)

```json
{
  "item": {
    "id": "651a2b3c...",
    "email": "user@example.com",
    "firstName": "Jane",
    "lastName": "Doe",
    "role": "admin",
    "isEmailVerified": true,
    "addresses": [],
    "preferences": {
      "newsletter": false,
      "marketing": false,
      "currency": "USD",
      "language": "en"
    },
    "createdAt": "...",
    "updatedAt": "..."
  }
}
```

### Errors

- **404 Not Found**: User not found.
- **400 Bad Request**: Invalid ID format.

---

## 3. Update User

- **Endpoint**: `PUT /api/users/:id`
- **Roles Required**: `admin`
- **Description**: Updates a user's profile information. Only Admins can perform this action.

### Request Body Schema

```typescript
interface UpdateUserRequest {
  firstName?: string; // Min 1, Max 120 chars
  lastName?: string; // Min 1, Max 120 chars
  phone?: string; // Min 3, Max 40 chars
  role?: "admin" | "customer" | "moderator";
  isEmailVerified?: boolean;
}
```

### Example Request

```json
{
  "firstName": "Jonathan",
  "role": "moderator",
  "isEmailVerified": true
}
```

### Response Example (200 OK)

Returns the updated user object.

```json
{
  "item": {
    "id": "651a2b3c...",
    "firstName": "Jonathan",
    "lastName": "Doe",
    "role": "moderator",
    "isEmailVerified": true,
    ...
  }
}
```

### Errors

- **404 Not Found**: User not found.
- **400 Bad Request**: Validation failed (e.g., invalid role).

---

## 4. Delete User

- **Endpoint**: `DELETE /api/users/:id`
- **Roles Required**: `admin`
- **Description**: Permanently deletes a user account. This action cannot be undone.

### Path Parameters

| Parameter | Type   | Required | Description                           |
| :-------- | :----- | :------- | :------------------------------------ |
| `id`      | String | Yes      | The MongoDB ID of the user to delete. |

### Logic Notes

- **Self-Deletion Prevention**: Admins cannot delete their own account using this endpoint. Attempting to do so will result in a `400 Bad Request` error.

### Response Example (200 OK)

```json
{
  "success": true
}
```

### Errors

- **404 Not Found**: User not found.
- **400 Bad Request**: Attempting to delete own account.
