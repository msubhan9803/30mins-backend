var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import { SUBSCRIPTIONS_EVENTS } from './../../../../constants/enums';
import pubSub from '../pubSub';
import { withFilter } from 'graphql-subscriptions';
export default {
    subscribe: withFilter(() => pubSub.asyncIterator([SUBSCRIPTIONS_EVENTS.CREATE_MESSAGE_EVENT]), (payload, variables) => __awaiter(void 0, void 0, void 0, function* () {
        return payload.newMessage.email !== variables.email;
    })),
};
//# sourceMappingURL=newMessage.js.map