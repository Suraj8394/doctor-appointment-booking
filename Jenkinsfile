pipeline {
    agent any

    stages {

        stage('Check Docker Daemon') {
            steps {
                bat '''
                echo Checking if Docker daemon is running...
                docker version || (
                    echo Docker NOT running!
                    exit 1
                )
                '''
            }
        }

        stage('Checkout Code') {
            steps {
                git branch: 'main', url: 'https://github.com/Suraj8394/doctor-appointment-booking.git'
            }
        }

        stage('Stop Old Containers') {
            steps {
                bat '''
                echo ===== Stopping Old Containers =====
                docker-compose down --remove-orphans --volumes || echo No old containers
                '''
            }
        }

        stage('Clean Leftover Containers') {
            steps {
                bat '''
                echo ===== Removing Leftover Containers =====
                for %%C in (
                    backend_doctor_app
                    frontend_doctor_app
                    admin_doctor_app
                ) do (
                    docker rm -f %%C 2>nul || echo Container %%C not found
                )
                '''
            }
        }

        stage('Build Images') {
            steps {
                bat '''
                echo ===== Building Docker Images =====
                docker-compose build --no-cache
                '''
            }
        }

        stage('Start Containers') {
            steps {
                bat '''
                echo ===== Starting Docker Containers =====
                docker-compose up -d --remove-orphans
                '''
            }
        }

        stage('Verify Running Containers') {
            steps {
                bat '''
                echo ===== Active Containers =====
                docker ps
                '''
            }
        }
    }

    post {
        success {
            echo "🎉 Successfully Built & Deployed Containers!"
        }
        failure {
            echo "❌ Build Failed — Check Console Output."
        }
    }
}
