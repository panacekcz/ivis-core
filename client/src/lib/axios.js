'use strict';

import csfrToken from 'csfrToken';
import axios from 'axios';
import interoperableErrors from '../../../shared/interoperable-errors';

const axiosInst = axios.create({
    headers: {
        'X-CSRF-TOKEN': csfrToken
    }
});

const axiosWrapper = {
    get: (...args) => axiosInst.get(...args).catch(error => { throw interoperableErrors.deserialize(error.response.data) || error }),
    put: (...args) => axiosInst.put(...args).catch(error => { throw interoperableErrors.deserialize(error.response.data) || error }),
    post: (...args) => axiosInst.post(...args).catch(error => { throw interoperableErrors.deserialize(error.response.data) || error }),
    delete: (...args) => axiosInst.delete(...args).catch(error => { throw interoperableErrors.deserialize(error.response.data) || error })
};

const HTTPMethod = {
    GET: axiosWrapper.get,
    PUT: axiosWrapper.put,
    POST: axiosWrapper.post,
    DELETE: axiosWrapper.delete
};

axiosWrapper.method = (method, ...args) => method(...args);

export default axiosWrapper;
export {
    HTTPMethod
}
