pipeline {
    agent any

    stages {

        stage('Checkout') {
            steps {
                git branch: 'main', url: 'https://github.com/Suraj8394/doctor-appointment-booking.git'
            }
        }

        stage('Clean Old Containers') {
            steps {
                script {
                    bat '''
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
    }
}
