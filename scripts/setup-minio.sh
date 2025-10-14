#!/bin/bash

# MinIO Setup Script
echo "🚀 Setting up MinIO for Affiliate Links Application..."

# Check if .env file exists
if [ ! -f .env ]; then
    echo "📝 Creating .env file from template..."
    cp .env.minio.example .env
    echo "✅ .env file created. Please edit it with your preferred settings."
fi

# Create necessary directories
echo "📁 Creating directories..."
mkdir -p docker-data/minio/policies
mkdir -p docker-data/minio/data

# Create custom policy directory
echo "📋 Creating custom policies..."
cat > docker-data/minio/policies/app-policy.json << 'EOF'
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "s3:GetObject",
        "s3:PutObject",
        "s3:DeleteObject",
        "s3:ListBucket"
      ],
      "Resource": [
        "arn:aws:s3:::affiliate-links/*",
        "arn:aws:s3:::affiliate-links"
      ]
    }
  ]
}
EOF

# Start MinIO
echo "🐳 Starting MinIO containers..."
docker-compose up -d minio

echo "⏳ Waiting for MinIO to be ready..."
sleep 10

# Check if MinIO is running
if curl -f http://localhost:9000/minio/health/live > /dev/null 2>&1; then
    echo "✅ MinIO is running successfully!"
    echo ""
    echo "🌐 Access URLs:"
    echo "   API: http://localhost:9000"
    echo "   Console: http://localhost:9001"
    echo ""
    echo "🔑 Default Credentials:"
    echo "   Username: minioadmin"
    echo "   Password: minioadmin123"
    echo ""
    echo "📝 Don't forget to:"
    echo "   1. Change the default credentials"
    echo "   2. Update your application .env file"
    echo "   3. Run 'docker-compose up -d minio-setup' to create buckets and users"
else
    echo "❌ MinIO failed to start. Check logs with: docker-compose logs minio"
fi