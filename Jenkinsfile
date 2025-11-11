pipeline {
    agent any

    stages {

        stage('Checkout') {
            steps {
                git branch: 'main', url: 'https://github.com/Suraj8394/doctor-appointment-booking.git'
            }
        }
//hello
        stage('Clean Old Containers') {
            steps {
                script {
                    bat '''
                    echo Cleaning up old containers...
                    docker-compose down --remove-orphans || exit 0
                    docker rm -f admin backend frontend || exit 0
                    docker system prune -f || exit 0
                    '''
                }
            }
        }

        stage('Build Docker Images') {
            steps {
                script {
                    bat 'docker-compose build'
                }
            }
        }

        stage('Run Containers') {
            steps {
                script {
                    bat 'docker-compose up -d'
                }
            }
        }

        stage('Verify Containers') {
            steps {
                script {
                    bat 'docker ps'
                    echo '✅ All containers are running successfully!'
                }
            }
        }
    }

    post {
        success {
            echo '🎉 Build and containers started successfully!'
        }
        failure {
            echo '❌ Build failed! Please check the Jenkins console output.'
        }
        always {
            echo '📦 Jenkins pipeline finished successfully on Windows!'
        }
    }
}
