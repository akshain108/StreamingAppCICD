pipeline {
    agent any

    environment {
        AWS_REGION = 'ap-south-1'

        AWS_ACCOUNT_ID = '038501649978'

        ECR_REGISTRY = "${AWS_ACCOUNT_ID}.dkr.ecr.${AWS_REGION}.amazonaws.com"

        FRONTEND_IMAGE  = "${ECR_REGISTRY}/streaming-frontend"
        AUTH_IMAGE      = "${ECR_REGISTRY}/streaming-auth"
        STREAMING_IMAGE = "${ECR_REGISTRY}/streaming-service"
        ADMIN_IMAGE     = "${ECR_REGISTRY}/streaming-admin"
        CHAT_IMAGE      = "${ECR_REGISTRY}/streaming-chat"
    }

    stages {

        stage('Checkout') {
            steps {
                checkout scm
            }
        }

        stage('Check Tools') {
            steps {
                sh 'git --version'
                sh 'docker --version'
                sh 'aws --version'
            }
        }

        stage('AWS Login') {
            steps {
                withCredentials([
                    [$class: 'AmazonWebServicesCredentialsBinding',
                     credentialsId: 'aws-ecr-credentials-akshai']
                ]) {
                    sh '''
                        aws ecr get-login-password --region $AWS_REGION \
                        | docker login \
                        --username AWS \
                        --password-stdin $ECR_REGISTRY
                    '''
                }
            }
        }

        stage('Build Images') {
            steps {
        sh '''
            echo "Building frontend with EKS API URLs"
            docker build \
              --build-arg REACT_APP_AUTH_API_URL=http://a1f0ca805fea748d0a80fd27271042a0-431233775.ap-south-1.elb.amazonaws.com/api/auth \
              --build-arg REACT_APP_STREAMING_API_URL=http://a1f0ca805fea748d0a80fd27271042a0-431233775.ap-south-1.elb.amazonaws.com/api/streaming \
              --build-arg REACT_APP_STREAMING_PUBLIC_URL=http://a1f0ca805fea748d0a80fd27271042a0-431233775.ap-south-1.elb.amazonaws.com \
              --build-arg REACT_APP_ADMIN_API_URL=http://a1f0ca805fea748d0a80fd27271042a0-431233775.ap-south-1.elb.amazonaws.com/api/admin \
              --build-arg REACT_APP_CHAT_API_URL=http://a1f0ca805fea748d0a80fd27271042a0-431233775.ap-south-1.elb.amazonaws.com/api/chat \
              --build-arg REACT_APP_CHAT_SOCKET_URL=http://a1f0ca805fea748d0a80fd27271042a0-431233775.ap-south-1.elb.amazonaws.com \
              -t $FRONTEND_IMAGE:latest \
              ./frontend

            docker build \
              -t $AUTH_IMAGE:latest \
              ./backend/authService

            docker build \
              -t $STREAMING_IMAGE:latest \
              -f ./backend/streamingService/Dockerfile \
              ./backend

            docker build \
              -t $ADMIN_IMAGE:latest \
              -f ./backend/adminService/Dockerfile \
              ./backend

            docker build \
              -t $CHAT_IMAGE:latest \
              -f ./backend/chatService/Dockerfile \
              ./backend
        '''
            }
        }

        stage('Push Images') {
            steps {
                sh '''
                    docker push $FRONTEND_IMAGE:latest
                    docker push $AUTH_IMAGE:latest
                    docker push $STREAMING_IMAGE:latest
                    docker push $ADMIN_IMAGE:latest
                    docker push $CHAT_IMAGE:latest
                '''
            }
        }
    }

    post {
        success {
            echo 'All Docker images were built and pushed successfully!'
        }

        failure {
            echo 'Jenkins pipeline failed.'
        }
    }
}