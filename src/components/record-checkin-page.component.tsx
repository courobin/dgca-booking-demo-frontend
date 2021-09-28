/*
 * eu-digital-green-certificates/ dgca-booking-demo-frontend
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

import React, { Fragment } from 'react';
import { Fade, Container, Row, Col, Button, Collapse, Spinner } from 'react-bootstrap';

import '../i18n';
import { useTranslation } from 'react-i18next';

import QRCode from 'qrcode.react';
import jwt_decode from "jwt-decode";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faCheckCircle, faExclamationCircle, faTimesCircle, faCircle } from '@fortawesome/free-solid-svg-icons'

import AppContext from '../misc/appContext';
import utils from "../misc/utils";

import DemoSpinner from './spinner/spinner.component';

import { BookingResponse } from '../interfaces/booking-response';
import { DisplayPassenger } from '../interfaces/display-passenger';

import { useGetInitialize, useStatus } from '../api';
import { Result } from '../interfaces/result';

const RecordCheckinPage = (props: any) => {

    const { t } = useTranslation();
    const context = React.useContext(AppContext);

    const [isInit, setIsInit] = React.useState(false);
    const [bookingResponse, setBookingResponse] = React.useState<BookingResponse>();

    const [displayPassengers, setDisplayPassengers] = React.useState<DisplayPassenger[]>([]);
    const displayPassengersRef = React.useRef(displayPassengers);
    displayPassengersRef.current = displayPassengers;

    const handleError = (error: any) => {
        let msg = '';

        if (error) {
            console.log(error);
            msg = error.message
        }

        props.setError({ error: error, message: msg, onCancel: context.navigation!.toLanding });
    }

    const [getQrCodePromise] = useGetInitialize(undefined, handleError);
    const [getStatusPromise] = useStatus(undefined, handleError);


    // on mount
    React.useEffect(() => {
        if (props) {
            setBookingResponse(props.bookingResponse);
        }
    }, [])


    // on init --> navigation ist needed
    React.useEffect(() => {
        if (context.navigation) {
            setIsInit(true);
        }
    }, [context.navigation])


    // on bookingResponse change --> set displaydata and init polling
    React.useEffect(() => {
        if (bookingResponse) {

            const tmpDisplayPassengers: DisplayPassenger[] = [];
            let timeoutIds: NodeJS.Timeout[] = [];
            let intervalIds: number[] = [];

            for (const passenger of bookingResponse.passengers) {
                // create display passenger from passenger
                let tmpDisplayPassenger: DisplayPassenger = { ...passenger };

                getQrCodePromise(passenger.id)
                    .then(response => {
                        // token for upcomming pollin
                        tmpDisplayPassenger.token = response.data.token;
                        // qr-code for display
                        tmpDisplayPassenger.qrCode = JSON.stringify(response.data);

                        // timeout and interval for status polling
                        timeoutIds.push(setTimeout(() => {
                            const intervalId = setInterval(getStatus, 5000, passenger.id);
                            tmpDisplayPassenger.intervalId = intervalId;

                            intervalIds.push(intervalId);
                            getStatus(passenger.id);
                        }, 5000));

                    })
                    .catch(error => {
                        handleError(error);
                    })
                    .finally(() => {
                        // collect all displaypassengers
                        tmpDisplayPassengers.push(tmpDisplayPassenger);

                        // set all display passengers at once
                        if (tmpDisplayPassengers.length === bookingResponse.passengers.length) {
                            setDisplayPassengers(tmpDisplayPassengers);
                        }
                    });
            }

            // on unmount all open timeouts and intervals will be canceled
            return () => {
                timeoutIds.forEach(timeoutId => clearTimeout(timeoutId));
                intervalIds.forEach(intervalId => clearInterval(intervalId));
            };
        }

    }, [bookingResponse])

    const getStatus = (id: string) => {
        // find current passenger from Ref --> it will be called by timeout
        const passenger = displayPassengersRef.current.find(p => p.id === id);

        if (passenger) {
            getStatusPromise(passenger)
                .then(response => {
                    // update status
                    passenger.status = response.status;

                    // update result
                    if (response.data && response.data.confirmation) {
                        passenger.result = response.data;
                        passenger.parsedToken = jwt_decode(response.data.confirmation);
                    }
                })
                .catch(error => {
                    handleError(error);
                })
                .finally(() => {
                    // check whether further polling is needed
                    checkPolling(passenger);
                    // spread all current display passengers into help array
                    let tmpDisplayPassengers: DisplayPassenger[] = [...displayPassengersRef.current];
                    // set updated array
                    setDisplayPassengers(tmpDisplayPassengers);
                });
        }
    }

    const checkPolling = (passenger: DisplayPassenger) => {
        // if OK or Expired
        if (passenger.intervalId
            && (
                (
                    passenger.result
                    && passenger.result.result === 'OK'
                )
                || (
                    passenger.parsedToken
                    && passenger.parsedToken.iat
                    && (passenger.parsedToken.iat * 1000) < Date.now()
                )
            )
        ) {
            clearInterval(passenger.intervalId);
            passenger.intervalId = undefined;
        }
    }

    const getStatusIcon = (passenger: DisplayPassenger | undefined): any => {
        const status: JSX.Element[] = [];

        if (passenger) {
            let icon: any = {};

            switch (passenger.status) {
                case 200: {
                    if (passenger.result?.result) {
                        switch (passenger.result.result) {
                            case 'OK':
                                icon = <FontAwesomeIcon icon={faCheckCircle} color="green" key='icon' />
                                break;

                            case 'NOK':
                                icon = <FontAwesomeIcon icon={faTimesCircle} color="red" key='icon' />
                                break;

                            case 'CHK':
                                icon = <FontAwesomeIcon icon={faExclamationCircle} color="orange" key='icon' />
                                break;

                            default:
                                break;
                        }
                    }
                    break;
                }
                case 401:
                case 410:
                    icon = <FontAwesomeIcon icon={faTimesCircle} color="red" key='icon' />;
                    break;
                case 204:
                default:
                    icon = <FontAwesomeIcon icon={faCircle} color="lightgrey" key='icon' />;
                    break;
            }

            if (icon) {
                status.push(icon);
                // if (passenger.intervalId) {
                //     status.push(<Spinner
                //         animation="border"
                //         key='spinner'
                //         className='d-flex mx-auto'
                //         size="sm"
                //         role="status"
                //         aria-hidden="true"
                //         variant='primary'
                //     />);
                // }
            }
        }

        return status;
    }

    return (!(isInit)
        ? <></>
        : <Fade appear={true} in={true} >
            <Container className='content-container'>

                <Row >
                    <h1 className='head-line'>{t('translation:checkin')}</h1>
                </Row>

                <Row>
                    <Col lg={7} className='mb-3'>
                        {t('translation:infoCheckin1')}<br />
                        {t('translation:infoCheckin2')}<br /><br />
                        {t('translation:infoCheckin3')}<br /><br />
                        {t('translation:infoCheckin4')}<br />
                        {t('translation:infoCheckin5')}
                    </Col>

                    <Col lg={5} className="wrapper-flight-information">

                        <Container className="flight-information column-container mb-3">
                            <span className='mb-1'>
                                <strong>Flight AIR094, Group booking</strong>
                            </span>

                            <span className='mb-1'>
                                Booking code {bookingResponse?.reference}<br />
                                {bookingResponse?.flightInfo.from}<br />
                                {bookingResponse?.flightInfo.to}<br />
                                Economy Classic
                            </span>

                            <span className='mb-1'>
                                <strong>{bookingResponse?.passengers.length} Passender(s)</strong>
                            </span>

                            <span >
                                <strong>{utils.convertDateToOutputFormat(bookingResponse?.flightInfo.time)}</strong>
                            </span>
                        </Container>

                        <Row className=" dcc-information mx-0 mb-2 mt-3">
                            <Col xs='auto' className="logo" />
                            <Col className="text-vertical-center">{t('translation:dccCertificate')}</Col>
                        </Row>
                    </Col>

                </Row>
                <Row className="bold">

                    <Col xs={12} sm={2}>
                        <span className="text-vertical-center">
                            {t('translation:conditionFulfilled')}
                        </span>
                    </Col>

                    <Col xs={12} sm={5}>
                        <span className="text-vertical-left">
                            {t('translation:name')}
                        </span>
                    </Col>

                    {/* <Col xs={12} sm={2} lg={2} className="shrink-grow">
                            <span className="text-vertical-center">
                                {t('translation:lblUpload')}
                            </span>
                        </Col>
                        <Col xs={12} sm={1} lg={1} className="no-grow">
                            <span className="text-vertical-center">
                                {t('translation:or')}
                            </span>
                        </Col> */}

                    <Col xs={12} sm={5} lg={5} className="shrink-grow">
                        <span className="text-vertical-left">{t('translation:lblScan')}</span>
                    </Col>
                </Row>
                <hr />
                <div className='flex-fill'>
                    {!(displayPassengers.length > 0)
                        ? <DemoSpinner />
                        : <Collapse appear={true} in={true} >
                            <div>
                                {
                                    displayPassengers.map((passenger: DisplayPassenger) =>
                                        <Fragment key={passenger.id}>
                                            <Row>
                                                <Col xs={12} sm={2}>
                                                    <span className="text-vertical-center">
                                                        {getStatusIcon(passenger)}
                                                    </span>
                                                </Col>
                                                <Col xs={12} sm={5}>
                                                    <span>
                                                        <strong>{passenger.forename + ' ' + passenger.lastname}</strong>
                                                    </span>
                                                    {
                                                        !(passenger.result?.results && passenger.result?.results.length > 0)
                                                            ? <></>
                                                            : <Container className={(passenger.result?.result === 'NOK' ? 'error-information' : 'warning-information') + ' column-container p-1 my-3'} >
                                                                {passenger.result.results.map((result: Result) =>
                                                                    <span>
                                                                        {result.details}
                                                                    </span>)}
                                                            </Container>
                                                    }
                                                </Col>
                                                {/* <Col xs={12} sm={2} lg={2} className="shrink-grow"><Button className="upload-botton">{t('translation:upload')}</Button>
                                </Col>
                                //Colum for or
                                <Col xs={12} sm={1} lg={1} className="no-grow">
                                    &nbsp;
                                </Col> */}
                                                <Col xs={12} sm={5} lg={5} className="shrink-grow qr-code-container">
                                                    {
                                                        passenger.qrCode ? <> <QRCode id='qr-code-pdf' size={256} renderAs='canvas' value={passenger.qrCode} />
                                                        </> : <></>
                                                    }
                                                </Col>
                                            </Row>
                                            <hr />
                                        </Fragment>
                                    )}
                            </div>
                        </Collapse>
                    }
                </div>
                <Row className='justify-content-end'>
                    <Col lg='5'>
                        <Row >
                            <Col sm='6' className='d-grid mb-2 mb-sm-0' >
                                <Button
                                    className="buttons-line-button"
                                    onClick={context.navigation!.toLanding}
                                >
                                    {t('translation:cancel')}
                                </Button>
                            </Col>
                            <Col sm='6' className='d-grid'>
                                <Button
                                    className="ml-3 buttons-line-button"
                                    disabled={false}
                                >
                                    {t('translation:submitCheckin')}
                                </Button>
                            </Col>
                        </Row>
                    </Col>
                </Row>
            </Container>
        </Fade>
    )
}

export default RecordCheckinPage;
