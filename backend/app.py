from flask import Flask, request, jsonify
from flask_cors import CORS

from fraud_engine import evaluate_transaction

app = Flask(__name__)

CORS(app)


@app.route("/")
def home():
    return "UPI Fraud Detection Backend Running"


@app.route("/transaction", methods=["POST"])
def analyze_transaction():

    data = request.json

    result = evaluate_transaction(data)

    response = {
        **data,
        **result
    }

    return jsonify(response)


if __name__ == "__main__":
    app.run(debug=True)