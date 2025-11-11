pipeline {
    agent any

    stages {
        stage('Checkout') {
            steps {
                git branch: 'main', url: 'https://github.com/Suraj8394/doctor-appointment-booking.git'
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
        always {
            echo '📦 Jenkins pipeline finished successfully on Windows!'
        }
    }
}
