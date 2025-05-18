import {SUBSCRIPTIONS_EVENTS} from '../../../../constants/enums';
import pubSub from '../pubSub';
export default {
  subscribe: () => {
    return pubSub.asyncIterator([SUBSCRIPTIONS_EVENTS.STARTED_TYPING]);
  },
};
