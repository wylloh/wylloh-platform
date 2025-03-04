# Wylloh API Documentation

## Overview

The Wylloh API provides endpoints for authentication, content management, marketplace functionality, and token management. This document outlines the available endpoints, request/response formats, and authentication requirements.

## Base URL

**Development**: `http://localhost:4000/api`
**Production**: `https://api.wylloh.com/api`

## Authentication

Most endpoints require authentication using JWT tokens.

### Headers

```
Authorization: Bearer <token>
```

### Endpoints

## User Management

### Register a new user

**POST /users/register**

Register a new user account.

**Request Body:**
```json
{
  "username": "user123",
  "email": "user@example.com",
  "password": "securepassword"
}
```

**Response:**
```json
{
  "message": "User registered successfully",
  "user": {
    "id": "12345",
    "username": "user123",
    "email": "user@example.com",
    "roles": ["user"]
  },
  "token": "jwt_token_here"
}
```

### Login

**POST /users/login**

Authenticate a user and receive a token.

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "securepassword"
}
```

**Response:**
```json
{
  "message": "Login successful",
  "user": {
    "id": "12345",
    "username": "user123",
    "email": "user@example.com",
    "roles": ["user"]
  },
  "token": "jwt_token_here"
}
```

### Get User Profile

**GET /users/profile**

Get the current user's profile.

**Headers:**
```
Authorization: Bearer <token>
```

**Response:**
```json
{
  "message": "User profile retrieved",
  "user": {
    "id": "12345",
    "username": "user123",
    "email": "user@example.com",
    "roles": ["user"]
  }
}
```

### Update User Profile

**PUT /users/profile**

Update the current user's profile.

**Headers:**
```
Authorization: Bearer <token>
```

**Request Body:**
```json
{
  "username": "updatedUsername",
  "email": "newemail@example.com"
}
```

**Response:**
```json
{
  "message": "User profile updated",
  "user": {
    "id": "12345",
    "username": "updatedUsername",
    "email": "newemail@example.com",
    "roles": ["user"]
  }
}
```

### Connect Wallet

**POST /users/wallet**

Connect a blockchain wallet to the user account.

**Headers:**
```
Authorization: Bearer <token>
```

**Request Body:**
```json
{
  "walletAddress": "0x1234567890abcdef1234567890abcdef12345678",
  "signature": "0x..."
}
```

**Response:**
```json
{
  "message": "Wallet connected successfully",
  "walletAddress": "0x1234567890abcdef1234567890abcdef12345678"
}
```

## Content Management

### Create Content

**POST /content**

Create a new content entry.

**Headers:**
```
Authorization: Bearer <token>
```

**Request Body:**
```json
{
  "title": "Content Title",
  "description": "Content Description",
  "contentType": "movie",
  "ipfsCid": "QmXYZ123...",
  "visibility": "private"
}
```

**Response:**
```json
{
  "message": "Content created successfully",
  "content": {
    "id": "content123",
    "title": "Content Title",
    "description": "Content Description",
    "contentType": "movie",
    "ipfsCid": "QmXYZ123...",
    "creator": "user123",
    "status": "active",
    "createdAt": "2023-11-15T12:00:00.000Z",
    "updatedAt": "2023-11-15T12:00:00.000Z"
  }
}
```

### Get All Content

**GET /content**

Get all content with pagination and filtering.

**Query Parameters:**
- `page`: Page number (default: 1)
- `limit`: Items per page (default: 10)
- `contentType`: Filter by content type
- `status`: Filter by content status

**Response:**
```json
{
  "message": "Content retrieved successfully",
  "count": 42,
  "pagination": {
    "page": 1,
    "limit": 10,
    "totalPages": 5
  },
  "content": [
    {
      "id": "content123",
      "title": "Content Title",
      "description": "Content Description",
      "contentType": "movie",
      "ipfsCid": "QmXYZ123...",
      "creator": {
        "id": "user123",
        "username": "creator1"
      },
      "status": "active",
      "createdAt": "2023-11-15T12:00:00.000Z"
    },
    // Additional content items...
  ]
}
```

### Get Content by ID

**GET /content/:id**

Get a specific content item by ID.

**Response:**
```json
{
  "message": "Content retrieved successfully",
  "content": {
    "id": "content123",
    "title": "Content Title",
    "description": "Content Description",
    "contentType": "movie",
    "ipfsCid": "QmXYZ123...",
    "creator": {
      "id": "user123",
      "username": "creator1"
    },
    "status": "active",
    "createdAt": "2023-11-15T12:00:00.000Z",
    "updatedAt": "2023-11-15T12:00:00.000Z"
  }
}
```

### Update Content

**PUT /content/:id**

Update a content item.

**Headers:**
```
Authorization: Bearer <token>
```

**Request Body:**
```json
{
  "title": "Updated Title",
  "description": "Updated Description",
  "status": "active"
}
```

**Response:**
```json
{
  "message": "Content updated successfully",
  "content": {
    "id": "content123",
    "title": "Updated Title",
    "description": "Updated Description",
    "contentType": "movie",
    "status": "active",
    "updatedAt": "2023-11-16T12:00:00.000Z"
  }
}
```

### Delete Content

**DELETE /content/:id**

Delete a content item.

**Headers:**
```
Authorization: Bearer <token>
```

**Response:**
```json
{
  "message": "Content deleted successfully",
  "content": {
    "id": "content123",
    "title": "Content Title"
  }
}
```

### Search Content

**GET /content/search**

Search for content.

**Query Parameters:**
- `query`: Search query string
- `contentType`: Filter by content type
- `page`: Page number (default: 1)
- `limit`: Items per page (default: 10)

**Response:**
```json
{
  "message": "Search results retrieved successfully",
  "count": 5,
  "content": [
    // Content items matching search criteria
  ]
}
```

## Tokens

### Create Token

**POST /tokens**

Create a new token for content.

**Headers:**
```
Authorization: Bearer <token>
```

**Request Body:**
```json
{
  "contentId": "content123",
  "totalSupply": 1000,
  "rightsThresholds": [
    {
      "quantity": 1,
      "rightsType": 1,
      "description": "Personal Viewing"
    },
    {
      "quantity": 100,
      "rightsType": 2,
      "description": "Small Venue (50 seats)"
    }
  ],
  "royaltyPercentage": 10
}
```

**Response:**
```json
{
  "message": "Token created successfully",
  "token": {
    "tokenId": "12345",
    "contractAddress": "0x1234567890abcdef1234567890abcdef12345678",
    "owner": "0x9876543210abcdef1234567890abcdef12345678",
    "totalSupply": 1000,
    "transactionHash": "0x...",
    "tokenURI": "ipfs://Qm..."
  }
}
```

### Get Token by ID

**GET /tokens/:tokenId**

Get token details by ID.

**Response:**
```json
{
  "message": "Token retrieved successfully",
  "token": {
    "tokenId": "12345",
    "contractAddress": "0x1234567890abcdef1234567890abcdef12345678",
    "tokenURI": "ipfs://Qm...",
    "totalSupply": "1000",
    "contentId": "content123",
    "contentType": "movie",
    "creator": "0x9876543210abcdef1234567890abcdef12345678",
    "rightsThresholds": [
      {
        "quantity": "1",
        "rightsType": 1,
        "enabled": true
      },
      {
        "quantity": "100",
        "rightsType": 2,
        "enabled": true
      }
    ],
    "royaltyRecipient": "0x9876543210abcdef1234567890abcdef12345678",
    "royaltyPercentage": 10
  }
}
```

### Verify Token Rights

**POST /tokens/verify**

Verify token ownership and rights.

**Request Body:**
```json
{
  "tokenId": "12345",
  "walletAddress": "0x1234567890abcdef1234567890abcdef12345678",
  "rightsType": 1
}
```

**Response:**
```json
{
  "message": "Token rights verified",
  "valid": true,
  "rightsType": 1,
  "description": "Personal Viewing"
}
```

## Marketplace

### Get Listings

**GET /marketplace/listings**

Get all active marketplace listings.

**Query Parameters:**
- `page`: Page number (default: 1)
- `limit`: Items per page (default: 10)
- `contentType`: Filter by content type
- `minPrice`: Filter by minimum price
- `maxPrice`: Filter by maximum price
- `currency`: Filter by currency

**Response:**
```json
{
  "message": "Listings retrieved successfully",
  "count": 25,
  "pagination": {
    "page": 1,
    "limit": 10,
    "totalPages": 3
  },
  "listings": [
    {
      "id": "listing123",
      "tokenId": "12345",
      "contractAddress": "0x1234567890abcdef1234567890abcdef12345678",
      "contentId": {
        "id": "content123",
        "title": "Content Title",
        "description": "Content Description",
        "thumbnailCid": "QmXYZ123..."
      },
      "seller": {
        "id": "user123",
        "username": "creator1",
        "walletAddress": "0x9876543210abcdef1234567890abcdef12345678"
      },
      "quantity": 10,
      "price": 0.01,
      "currency": "MATIC",
      "status": "active",
      "createdAt": "2023-11-15T12:00:00.000Z"
    },
    // Additional listings...
  ]
}
```

### Create Listing

**POST /marketplace/list**

Create a new listing.

**Headers:**
```
Authorization: Bearer <token>
```

**Request Body:**
```json
{
  "contentId": "content123",
  "quantity": 10,
  "price": 0.01,
  "currency": "MATIC",
  "expiresAt": "2024-11-15T12:00:00.000Z"
}
```

**Response:**
```json
{
  "message": "Listing created successfully",
  "listing": {
    "id": "listing123",
    "tokenId": "12345",
    "contractAddress": "0x1234567890abcdef1234567890abcdef12345678",
    "contentId": "content123",
    "seller": "user123",
    "quantity": 10,
    "price": 0.01,
    "currency": "MATIC",
    "status": "active",
    "expiresAt": "2024-11-15T12:00:00.000Z",
    "createdAt": "2023-11-15T12:00:00.000Z"
  }
}
```

### Purchase Token

**POST /marketplace/purchase**

Purchase a listed token.

**Headers:**
```
Authorization: Bearer <token>
```

**Request Body:**
```json
{
  "listingId": "listing123",
  "quantity": 1
}
```

**Response:**
```json
{
  "message": "Purchase completed successfully",
  "transaction": {
    "listingId": "listing123",
    "tokenId": "12345",
    "contractAddress": "0x1234567890abcdef1234567890abcdef12345678",
    "seller": "user123",
    "buyer": "user456",
    "quantity": 1,
    "price": 0.01,
    "currency": "MATIC",
    "totalAmount": 0.01,
    "transactionHash": "0x...",
    "purchasedAt": "2023-11-16T12:00:00.000Z"
  }
}
```

## Storage Service

### Upload Content

**POST /api/content/upload**

Initiate content upload.

**Headers:**
```
Authorization: Bearer <token>
```

**Response:**
```json
{
  "message": "Initiate upload route - To be implemented",
  "uploadId": "placeholder-upload-id"
}
```

### Upload Content Chunk

**POST /api/content/upload/:uploadId/chunk**

Upload content chunk.

**Headers:**
```
Authorization: Bearer <token>
```

**Form Data:**
- `chunk`: File chunk
- `chunkIndex`: Chunk index

**Response:**
```json
{
  "message": "Upload chunk route for upload ID: upload123 - To be implemented",
  "chunkIndex": 0
}
```

### Complete Upload

**POST /api/content/upload/:uploadId/complete**

Complete chunked upload.

**Headers:**
```
Authorization: Bearer <token>
```

**Response:**
```json
{
  "message": "Complete upload route for upload ID: upload123 - To be implemented",
  "contentId": "placeholder-content-id",
  "cid": "placeholder-ipfs-cid"
}
```

## IPFS Integration

### Get Content from IPFS

**GET /api/ipfs/:cid**

Get content from IPFS by CID.

**Headers:**
```
Authorization: Bearer <token>
```

**Response:**
```json
{
  "message": "Get content route for CID: QmXYZ123... - To be implemented"
}
```

### Pin Content to IPFS

**POST /api/ipfs/pin**

Pin content to IPFS.

**Headers:**
```
Authorization: Bearer <token>
```

**Request Body:**
```json
{
  "cid": "QmXYZ123..."
}
```

**Response:**
```json
{
  "message": "Pin content route - To be implemented",
  "cid": "QmXYZ123..."
}
```

## Response Status Codes

- `200 OK`: The request was successful
- `201 Created`: A resource was successfully created
- `400 Bad Request`: The request could not be understood or was missing required parameters
- `401 Unauthorized`: Authentication failed or user does not have permissions
- `403 Forbidden`: The user is authenticated but not authorized to perform the requested operation
- `404 Not Found`: The requested resource could not be found
- `500 Internal Server Error`: An error occurred on the server

## Error Responses

All error responses follow this format:

```json
{
  "error": {
    "message": "Error message here",
    "details": {} // Optional additional details
  }
}
```

## Pagination

Endpoints that return multiple items support pagination with the following query parameters:

- `page`: Page number (starting from 1)
- `limit`: Number of items per page

Paginated responses include a pagination object:

```json
{
  "pagination": {
    "totalCount": 42,
    "page": 1,
    "limit": 10,
    "totalPages": 5
  }
}
```

## Rate Limiting

API requests are rate limited to prevent abuse. The current limits are:

- 100 requests per minute for authenticated users
- 30 requests per minute for unauthenticated users

When the rate limit is exceeded, the API will respond with status code `429 Too Many Requests`.