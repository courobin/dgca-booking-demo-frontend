/* tslint:disable */
/* eslint-disable */
/**
 * EU Digital COVID Certificate Booking Demo
 * The API provides exemplary booking endpoints
 *
 * OpenAPI spec version: 0.0.1-SNAPSHOT
 * 
 *
 * NOTE: This class is auto generated by the swagger code generator program.
 * https://github.com/swagger-api/swagger-codegen.git
 * Do not edit the class manually.
 */
/**
 * 
 * @export
 * @interface BookingPassengerDccStatusResponse
 */
export interface BookingPassengerDccStatusResponse {
    /**
     * 
     * @type {string}
     * @memberof BookingPassengerDccStatusResponse
     */
    issuer?: any;
    /**
     * 
     * @type {number}
     * @memberof BookingPassengerDccStatusResponse
     */
    iat?: any;
    /**
     * 
     * @type {string}
     * @memberof BookingPassengerDccStatusResponse
     */
    sub?: any;
    /**
     * 
     * @type {Array&lt;BookingPassengerDccStatusResultResponse&gt;}
     * @memberof BookingPassengerDccStatusResponse
     */
    results?: any;
    /**
     * 
     * @type {string}
     * @memberof BookingPassengerDccStatusResponse
     */
    confirmation?: any;
}
