pipeline {
    agent any

    stages {

        stage('Checkout') {
            steps {
                git branch: 'main', url: 'https://github.com/Suraj8394/doctor-appointment-booking.git'
            }
        }

        stage('Clean') {
            steps {
                bat 'docker-compose down --remove-orphans --volumes || echo skip'
            }
        }

        stage('Build') {
            steps {
                bat 'docker-compose build --no-cache'
            }
        }

        stage('Run') {
            steps {
                bat 'docker-compose up -d --remove-orphans'
            }
        }

        stage('Verify') {
            steps {
                bat 'docker ps -a'
            }
        }
    }

    post {
        success {
            echo "🎉 Success!"
        }
        failure {
            echo "❌ Failed!"
        }
    }
}
