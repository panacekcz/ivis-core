'use strict';

import React, {Component} from "react";
import {Panel} from "../lib/panel";
import {withErrorHandling, withAsyncErrorHandler} from "../lib/error-handling";
import {LineChart} from "../ivis/LineChart";
import {TimeRangeSelector} from "../ivis/TimeRangeSelector";
import {translate} from "react-i18next";
import {TimeContext} from "../ivis/TimeContext";
import {rgb} from "d3-color";

@translate()
@withErrorHandling
export default class Home extends Component {
    constructor(props) {
        super(props);

        const t = props.t;

        this.state = {
            config: {
                yScale: {
                    includedMin: 0,
                    includedMax: 100
                },
                signalSets: [
                    {
                        cid: 'process1',
                        signals: [
                            {
                                cid: 's1',
                                label: t('Sensor 1'),
                                color: rgb(70, 130, 180)
                            },
                            {
                                cid: 's2',
                                label: t('Sensor 2'),
                                color: rgb(250, 60, 60)
                            },
                            {
                                cid: 'ref',
                                label: t('Reference'),
                                color: rgb(150, 60, 60),
                                xFun: (ts, ys) => ({min: 100, avg: 100, max: 100})
                            }
                        ]
                    },
                    {
                        cid: 'process2',
                        signals: [
                            {
                                cid: 's1',
                                label: t('Sensor 1'),
                                color: rgb(30, 70, 120)
                            },
                            {
                                cid: 's2',
                                label: t('Sensor 2'),
                                color: rgb(150, 30, 30)
                            }
                        ]
                    }
                ]
            }
        };
    }

    render() {
        const t = this.props.t;

        return (
            <Panel>
                <TimeContext>
                    <div className="row">
                        <div className="col-xs-12">
                            <TimeRangeSelector/>
                        </div>
                        <div className="col-xs-12">
                            <div>
                                <LineChart
                                    onClick={(selection, position) => {console.log(selection); console.log(position);}}
                                    config={this.state.config}
                                    height={500}
                                    margin={{ left: 40, right: 5, top: 5, bottom: 20 }}
                                />
                            </div>
                        </div>
                    </div>
                </TimeContext>
            </Panel>
        );
    }
}
