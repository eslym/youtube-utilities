import axios from "axios";

export const client = axios.create({
    headers: {
        common: {
            'Accept-Encoding': 'utf-8',
            'Accept-Language': 'en-US'
        }
    },
    timeout: 5000
});
