






## Architecture

The platform follows a three-tier architecture:

1.  **IoT Device Layer:** This layer consists of various IoT devices (e.g., sensors, smart lights) that collect data and send it to the edge gateway.
2.  **Edge Gateway Layer:** The edge gateway acts as an intermediary between the IoT devices and the cloud platform. It receives data from devices via MQTT, preprocesses it, and forwards it to the cloud. It can also receive commands from the cloud and send them to the devices.
3.  **Cloud Platform Layer:** This is the core of the platform, hosted in the cloud. It includes:
    *   **Web Application:** A React-based frontend for users to interact with the platform.
    *   **Backend Services:** A Flask-based backend that provides a RESTful API for all platform functions.
    *   **Database:** A combination of a relational database (SQLite) for storing user and device information, and a time-series database for storing IoT data.
    *   **Automation Engine:** A service that evaluates automation rules and executes actions.
    *   **MQTT Broker:** A Mosquitto MQTT broker for communication with the edge gateway.




## Getting Started

To get started with the IoT Platform, follow these steps:

### Prerequisites

*   Python 3.11 or higher
*   pip and venv
*   Node.js and pnpm
*   Mosquitto MQTT broker

### Installation

1.  **Clone the repository:**

    ```bash
    git clone <repository-url>
    cd iot-platform
    ```

2.  **Set up the backend:**

    ```bash
    cd iot_platform
    python3 -m venv venv
    source venv/bin/activate
    pip install -r requirements.txt
    ```

3.  **Set up the frontend:**

    ```bash
    cd ../iot-dashboard
    pnpm install
    ```

### Running the Platform

1.  **Start the Mosquitto MQTT broker:**

    ```bash
    sudo systemctl start mosquitto
    ```

2.  **Start the Flask backend:**

    ```bash
    cd ../iot_platform
    source venv/bin/activate
    python src/main.py
    ```

3.  **Start the React frontend:**

    ```bash
    cd ../iot-dashboard
    pnpm run dev
    ```

4.  **Start the edge gateway simulator:**

    ```bash
    cd ../iot_platform
    python edge_gateway_simulator.py
    ```

Now you can access the IoT Platform dashboard at `http://localhost:5173`.




## API Documentation

The IoT Platform provides a comprehensive RESTful API for interacting with the system. The API is organized into several endpoints:

*   `/api/auth`: User authentication and management.
*   `/api/devices`: Device management and data retrieval.
*   `/api/automation`: Automation rule management.
*   `/api/analytics`: Data analytics and visualization.

For detailed API documentation, please refer to the source code in the `src/routes` directory.




## Deployment

The IoT Platform is deployed and accessible at the following URL:

[https://g8h3ilc3x8zd.manus.space](https://g8h3ilc3x8zd.manus.space)

**Note:** The deployed version may have some limitations due to the sandbox environment. For full functionality, it is recommended to run the platform locally.


