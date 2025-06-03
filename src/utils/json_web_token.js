import JWT from "jsonwebtoken"

const createJSONWebToken = (payload, secretKey, expiresIn) => {
    if (typeof payload !== 'object' || !payload) {
        throw new Error("Payload must be a non-empty object");
    }
    if (typeof secretKey !== 'string' || secretKey === '') {
        throw new Error("Secret key must be a non-empty string");
    }
    if (typeof expiresIn !== 'string' && typeof expiresIn !== 'number') {
        throw new Error("expiresIn must be a non-empty string or a number");
    }
    try {
        return JWT.sign(payload, secretKey, { expiresIn })
    } catch (error) {
        throw new Error(error.message || 'JWT Internal Server Error');
    }
}

export default createJSONWebToken