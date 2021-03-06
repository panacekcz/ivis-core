'use strict';

import React, { Component } from 'react';
import ReactDOMServer from 'react-dom/server';
import { translate } from 'react-i18next';
import PropTypes from 'prop-types';

import jQuery from 'jquery';

import 'datatables.net';
import 'datatables.net-bs';
import 'datatables.net-bs/css/dataTables.bootstrap.css';

import axios from './axios';

import { withPageHelpers } from '../lib/page'
import { withErrorHandling, withAsyncErrorHandler } from './error-handling';
import styles from "./styles.scss";

//dtFactory();
//dtSelectFactory();


const TableSelectMode = {
    NONE: 0,
    SINGLE: 1,
    MULTI: 2
};


@translate(null, { withRef: true })
@withPageHelpers
@withErrorHandling
class Table extends Component {
    constructor(props) {
        super(props);
        this.selectionMap = this.getSelectionMap(props);
    }

    static propTypes = {
        dataUrl: PropTypes.string,
        data: PropTypes.array,
        columns: PropTypes.array,
        selectMode: PropTypes.number,
        selection: PropTypes.oneOfType([PropTypes.array, PropTypes.string, PropTypes.number]),
        selectionKeyIndex: PropTypes.number,
        selectionAsArray: PropTypes.bool,
        onSelectionChangedAsync: PropTypes.func,
        onSelectionDataAsync: PropTypes.func,
        withHeader: PropTypes.bool,
        refreshInterval: PropTypes.number
    }

    static defaultProps = {
        selectMode: TableSelectMode.NONE,
        selectionKeyIndex: 0
    }

    refresh() {
        if (this.table) {
            this.table.rows().draw('page');
        }
    }

    getSelectionMap(props) {
        let selArray = [];
        if (props.selectMode === TableSelectMode.SINGLE && !this.props.selectionAsArray) {
            if (props.selection !== null && props.selection !== undefined) {
                selArray = [props.selection];
            } else {
                selArray = [];
            }
        } else if ((props.selectMode === TableSelectMode.SINGLE && this.props.selectionAsArray) || props.selectMode === TableSelectMode.MULTI) {
            selArray = props.selection || [];
        }

        const selMap = new Map();

        for (const elem of selArray) {
            selMap.set(elem, undefined);
        }

        if (props.data) {
            for (const rowData of props.data) {
                const key = rowData[props.selectionKeyIndex];
                if (selMap.has(key)) {
                    selMap.set(key, rowData);
                }
            }

        } else if (this.table) {
            this.table.rows().every(function() {
                const rowData = this.data();
                const key = rowData[props.selectionKeyIndex];
                if (selMap.has(key)) {
                    selMap.set(key, rowData);
                }
            });
        }

        return selMap;
    }

    updateSelectInfo() {
        if (!this.jqSelectInfo) {
            return; // If the table is updated very quickly after mounting, the datatable may not be initialized yet.
        }

        const t = this.props.t;

        const count = this.selectionMap.size;
        if (this.selectionMap.size > 0) {
            const jqInfo = jQuery('<span>' + t('{{ count }} entries selected.', { count }) + ' </span>');
            const jqDeselectLink = jQuery('<a href="">Deselect all.</a>').on('click', ::this.deselectAll);

            this.jqSelectInfo.empty().append(jqInfo).append(jqDeselectLink);
        } else {
            this.jqSelectInfo.empty();
        }
    }

    @withAsyncErrorHandler
    async fetchData(data, callback) {
        // This custom ajax fetch function allows us to properly handle the case when the user is not authenticated.
        const response = await axios.post(this.props.dataUrl, data);
        callback(response.data);
    }

    @withAsyncErrorHandler
    async fetchAndNotifySelectionData() {
        if (this.props.onSelectionDataAsync) {
            if (!this.props.data) {
                const keysToFetch = [];
                for (const pair of this.selectionMap.entries()) {
                    if (!pair[1]) {
                        keysToFetch.push(pair[0]);
                    }
                }

                if (keysToFetch.length > 0) {
                    const response = await axios.post(this.props.dataUrl, {
                        operation: 'getBy',
                        column: this.props.selectionKeyIndex,
                        values: keysToFetch
                    });

                    for (const row of response.data) {
                        const key = row[this.props.selectionKeyIndex];
                        if (this.selectionMap.has(key)) {
                            this.selectionMap.set(key, row);
                        }
                    }
                }
            }

            this.notifySelection(this.props.onSelectionDataAsync, this.selectionMap);
        }
    }

    shouldComponentUpdate(nextProps, nextState) {
        const nextSelectionMap = this.getSelectionMap(nextProps);

        let updateDueToSelectionChange = false;
        if (nextSelectionMap.size !== this.selectionMap.size) {
            updateDueToSelectionChange = true;
        } else {
            for (const key of this.selectionMap.keys()) {
                if (!nextSelectionMap.has(key)) {
                    updateDueToSelectionChange = true;
                    break;
                }
            }
        }

        this.selectionMap = nextSelectionMap;

        return updateDueToSelectionChange || this.props.data !== nextProps.data || this.props.dataUrl !== nextProps.dataUrl;
    }

    componentDidMount() {
        const columns = this.props.columns.slice();

        // XSS protection and actions rendering
        for (const column of columns) {
            if (column.actions) {
                const createdCellFn = (td, data, rowData) => {
                    const linksContainer = jQuery(`<span class="${styles.actionLinks}"/>`);

                    let actions = column.actions(rowData);
                    let options = {};

                    if (!Array.isArray(actions)) {
                        options = actions;
                        actions = actions.actions;
                    }

                    for (const action of actions) {
                        if (action.action) {
                            const html = ReactDOMServer.renderToStaticMarkup(<a href="">{action.label}</a>);
                            const elem = jQuery(html);
                            elem.click((evt) => { evt.preventDefault(); action.action(this) });
                            linksContainer.append(elem);

                        } else if (action.link) {
                            const html = ReactDOMServer.renderToStaticMarkup(<a href={action.link}>{action.label}</a>);
                            const elem = jQuery(html);
                            elem.click((evt) => { evt.preventDefault(); this.navigateTo(action.link) });
                            linksContainer.append(elem);

                        } else if (action.href) {
                            const html = ReactDOMServer.renderToStaticMarkup(<a href={action.href}>{action.label}</a>);
                            const elem = jQuery(html);
                            linksContainer.append(elem);

                        } else {
                            const html = ReactDOMServer.renderToStaticMarkup(<span>{action.label}</span>);
                            const elem = jQuery(html);
                            linksContainer.append(elem);
                        }
                    }

                    if (options.refreshTimeout) {
                        const currentMS = Date.now();

                        if (!this.refreshTimeoutAt || this.refreshTimeoutAt > currentMS + options.refreshTimeout) {
                            clearTimeout(this.refreshTimeoutId);

                            this.refreshTimeoutAt = currentMS + options.refreshTimeout;

                            this.refreshTimeoutId = setTimeout(() => {
                                this.refreshTimeoutAt = 0;
                                this.refresh();
                            }, options.refreshTimeout);
                        }
                    }

                    jQuery(td).html(linksContainer);
                };

                column.type = 'html';
                column.createdCell = createdCellFn;

                if (!('data' in column)) {
                    column.data = null;
                    column.orderable = false;
                    column.searchable = false;
                }
            } else {
                const originalRender = column.render;
                column.render = (data, ...rest) => {
                    if (originalRender) {
                        const markup = originalRender(data, ...rest);
                        return ReactDOMServer.renderToStaticMarkup(<div>{markup}</div>);
                    } else {
                        return ReactDOMServer.renderToStaticMarkup(<div>{data}</div>)
                    }
                };
            }

            column.title = ReactDOMServer.renderToStaticMarkup(<div>{column.title}</div>);
        }

        const dtOptions = {
            columns
        };

        const self = this;
        dtOptions.createdRow = function(row, data) {
            const rowKey = data[self.props.selectionKeyIndex];

            if (self.selectionMap.has(rowKey)) {
                jQuery(row).addClass('selected');
            }

            jQuery(row).on('click', () => {
                const selectionMap = self.selectionMap;

                if (self.props.selectMode === TableSelectMode.SINGLE) {
                    if (selectionMap.size !== 1 || !selectionMap.has(rowKey)) {
                        self.notifySelection(self.props.onSelectionChangedAsync, new Map([[rowKey, data]]));
                    }

                } else if (self.props.selectMode === TableSelectMode.MULTI) {
                    const newSelMap = new Map(selectionMap);

                    if (selectionMap.has(rowKey)) {
                        newSelMap.delete(rowKey);
                    } else {
                        newSelMap.set(rowKey, data);
                    }

                    self.notifySelection(self.props.onSelectionChangedAsync, newSelMap);
                }
            });
        };

        dtOptions.initComplete = function() {
            self.jqSelectInfo = jQuery('<div class="dataTable_selection_info"/>');
            const jqWrapper = jQuery(self.domTable).parents('.dataTables_wrapper');
            jQuery('.dataTables_info', jqWrapper).after(self.jqSelectInfo);

            self.updateSelectInfo();
        };

        if (this.props.data) {
            dtOptions.data = this.props.data;
        } else {
            dtOptions.serverSide = true;
            dtOptions.ajax = ::this.fetchData;
        }

        this.table = jQuery(this.domTable).DataTable(dtOptions);

        if (this.props.refreshInterval) {
            this.refreshIntervalId = setInterval(() => this.refresh(), this.props.refreshInterval);
        }

        this.table.on('destroy.dt', () => {
           clearInterval(this.refreshIntervalId);
           clearTimeout(this.refreshTimeoutId);
        });

        this.fetchAndNotifySelectionData();
    }

    componentDidUpdate(prevProps, prevState) {
        if (this.props.data) {
            this.table.clear();
            this.table.rows.add(this.props.data);
        } else {
            // XXX: Changing URL changing from data to dataUrl is not implemented
            this.refresh();
        }

        const self = this;
        this.table.rows().every(function() {
            const key = this.data()[self.props.selectionKeyIndex];
            if (self.selectionMap.has(key)) {
                jQuery(this.node()).addClass('selected');
            } else {
                jQuery(this.node()).removeClass('selected');
            }
        });

        this.updateSelectInfo();
        this.fetchAndNotifySelectionData();
    }

    async notifySelection(eventCallback, newSelectionMap) {
        if (eventCallback) {
            const selPairs = Array.from(newSelectionMap).sort((l, r) => l[0] - r[0]);

            let data = selPairs.map(entry => entry[1]);
            let sel = selPairs.map(entry => entry[0]);

            if (this.props.selectMode === TableSelectMode.SINGLE && !this.props.selectionAsArray) {
                if (sel.length) {
                    sel = sel[0];
                    data = data[0];
                } else {
                    sel = null;
                    data = null;
                }
            }

            await eventCallback(sel, data);
        }
    }

    async deselectAll(evt) {
        evt.preventDefault();
        this.notifySelection(this.props.onSelectionChangedAsync, new Map());
    }

    render() {
        const t = this.props.t;
        const props = this.props;

        let className = 'table table-striped table-bordered';

        if (this.props.selectMode !== TableSelectMode.NONE) {
            className += ' table-hover';
        }

        return (
            <div>
                <table ref={(domElem) => { this.domTable = domElem; }} className={className} cellSpacing="0" width="100%" />
            </div>
        );
    }
}

/*
  Refreshes the table. This method is provided to allow programmatic refresh from a handler outside the table.
  The reference to the table can be obtained by ref.
 */
Table.prototype.refresh = function() {
    this.getWrappedInstance().refresh()
};

export {
    Table,
    TableSelectMode
}