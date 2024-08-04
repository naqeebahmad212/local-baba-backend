import {Error as mongooseError} from 'mongoose'
export class ApiErrorHandler extends   Error{
    statusCode:number
 
    constructor(message='Something went wrong',statusCode=500){
        super(message)
        this.statusCode=statusCode
        this.message=message
        
        // this.success=false
    }
}






export default ApiErrorHandler