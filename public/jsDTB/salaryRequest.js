class SalaryRequest {

    baseurl = 'https://localhost:8080/salary-request';

    constructor(id, employeeId, amount, dateRequested, status) {
        this.id = id;
        this.employeeId = employeeId;
        this.amount = amount;
        this.dateRequested = dateRequested;
        this.status = status;
    }


    async getList() {
        const response = await fetch(`${this.baseurl}/${employeeId}`);
        return response.json();
    }

    async send() {
        const response = await fetch(`${this.baseurl}/send`);
        return response.json();
    }

}