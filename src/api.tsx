/*
 * Corona-Warn-App / cwa-quick-test-frontend
 *
 * (C) 2021, T-Systems International GmbH
 *
 * Deutsche Telekom AG and all other contributors /
 * copyright owners license this file to you under the Apache
 * License, Version 2.0 (the "License"); you may not use this
 * file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing,
 * software distributed under the License is distributed on an
 * "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
 * KIND, either express or implied.  See the License for the
 * specific language governing permissions and limitations
 * under the License.
 */

import axios from 'axios';
import React from 'react';
import { BookingRequest } from './interfaces/booking-request';
import { BookingResponse } from './interfaces/booking-response';
import { IPerson } from './interfaces/person';

export const api = axios.create({
    baseURL: ''
});

export const useBooking = (onSuccess?: () => void, onError?: (error: any) => void) => {
    const [result, setResult] = React.useState<BookingResponse>();

    const baseUri = '/booking';

    const header = {
        'Content-Type': 'application/json'
    };

    const getBooking = (person: IPerson) => {
        console.log('Person: '); console.log(JSON.stringify(person));


        const bookingRequest: BookingRequest = { ...person }

        console.log('BookingRequest: '); console.log(JSON.stringify(bookingRequest));

        api.post(baseUri, bookingRequest, { headers: header })
            .then(response => {

                console.log('response: '); console.log(JSON.stringify(response.data));

                setResult(response.data);
                if (onSuccess) {
                    onSuccess();
                }
            })
            .catch(error => {
                if (onError) {
                    onError(error);
                }
            });
    }

    return [
        result,
        getBooking
    ] as const;
}

export const useGetValidationStatus = (onSuccess?: () => void, onError?: (error: any) => void) => {
    const [validationStatus, setValidationStatus] = React.useState<string>('');

    const baseUri = '/validationStatus';

    const header = {
        'Content-Type': 'application/json'
    };

    const getValidationStatus = () => {
        
        api.get(baseUri, { headers: header })
            .then(response => {

                console.log('validationStatus: '); console.log(JSON.stringify(response.data));

                setValidationStatus(response.data);
                if (onSuccess) {
                    console.log("Bin im Success");
                    onSuccess();
                }
            })
            .catch(error => {
                if (onError) {
                    onError(error);
                }
            });
    }

    return [
        validationStatus,
        getValidationStatus
    ] as const;
}

