db = db.getSiblingDB('wylloh');
db.createCollection('users');
db.createCollection('content');
print("MongoDB initialized for development");
