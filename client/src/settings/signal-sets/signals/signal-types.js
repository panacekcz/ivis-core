'use strict';
import {SignalType} from "../../../../../shared/signals";

export function getSignalTypes(t) {
    return {
        [SignalType.INTEGER]: t('Integer'),
        [SignalType.LONG]: t('Long'),
        [SignalType.FLOAT]: t('Float'),
        [SignalType.DOUBLE]: t('Double'),
        [SignalType.BOOLEAN]: t('Boolean'),
        [SignalType.KEYWORD]: t('Keyword'),
        [SignalType.DATE]: t('Date'),
        [SignalType.PAINLESS]: t('Script (Painless)'),
        
    }
}