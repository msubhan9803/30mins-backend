import {SUBSCRIPTIONS_EVENTS} from './../../../../constants/enums';
import pubSub from '../pubSub';
import {withFilter} from 'graphql-subscriptions';
export default {
  subscribe: withFilter(
    () => pubSub.asyncIterator([SUBSCRIPTIONS_EVENTS.CREATE_MESSAGE_EVENT]),
    async (payload, variables) => {
      return payload.newMessage.email !== variables.email;
    }
  ),
};
