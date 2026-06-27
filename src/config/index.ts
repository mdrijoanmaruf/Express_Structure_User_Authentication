import dotenv from "dotenv"
import path from "path"

dotenv.config({
    path:path.join(process.cwd(),".env"),
})

const config = {
    connection_string: process.env.CONNECTION_STRING as string,
    port : process.env.PORT,
    secrete : process.env.JWT_SECRETE
}

export default config;