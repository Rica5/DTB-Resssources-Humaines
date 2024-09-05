const request = require('supertest');
const app = require('../app'); // Adjust the path to your Express app
const {JSDOM} = require('jsdom')

jest.setTimeout(30000);

describe('GET /api/avance', function () {
    it('should render the view with correct content', async () => {
        const response = await request(app).get('/leave-tracking');
        // expect(response.status).toBe(200);
        // expect(response.text).toContain('<!-- End Topbar header -->');

        const dom = new JSDOM(response.text);
        const document = dom.window.document;
        // Select the button
        const button = document.querySelector('#myButton');

        // Check if button exists
        expect(button).not.toBeNull();

        // Mock the alert function
        dom.window.alert = jest.fn();

        // Simulate a click event
        const clickEvent = new dom.window.MouseEvent('click', {
            bubbles: true,
            cancelable: true,
        });
        button.dispatchEvent(clickEvent);
        expect(button.getAttribute('onclick')).toContain('alert')
        // Assert that the alert function was called
        // expect(dom.window.alert).toHaveBeenCalledWith('Hello world!');
    });
});
