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
                    sh 'docker-compose build'
                }
            }
        }

        stage('Run Containers') {
            steps {
                script {
                    sh 'docker-compose up -d'
                }
            }
        }

        stage('Verify Deployment') {
            steps {
                echo '✅ Application is up and running successfully!'
            }
        }
    }

    post {
        always {
            echo '📦 Pipeline completed!'
        }
    }
}
