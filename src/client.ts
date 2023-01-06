import axios, {AxiosAdapter} from "axios";

export const client = axios.create({
    headers: {
        common: {
            'Accept-Encoding': 'utf-8',
            'Accept-Language': 'en-US'
        }
    },
    timeout: 5000
});

type SingleOrMulti<T> = T | T[];

export function setAxiosAdapter(adapter: SingleOrMulti<AxiosAdapter | string>){
    client.defaults.adapter = adapter;
}
