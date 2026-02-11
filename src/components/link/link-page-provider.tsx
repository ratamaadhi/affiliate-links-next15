'use client';

import {
  LinkPageContext,
  LinkPageDispatchContext,
  LinkPageState,
  type LinkPageAction,
} from '@/context/link-page-context';
import { useReducer } from 'react';

const initialLinkPageState: LinkPageState = {
  selectedPage: null,
  keywordLink: '',
  reloadSignal: 0,
};

function linkPageReducer(
  state: LinkPageState,
  action: LinkPageAction
): LinkPageState {
  switch (action.type) {
    case 'changed': {
      return {
        ...state,
        selectedPage: action.payload || null,
      };
    }
    case 'search-link': {
      return {
        ...state,
        keywordLink: action.payload,
      };
    }
    case 'trigger-reload': {
      return {
        ...state,
        reloadSignal: state.reloadSignal + 1,
      };
    }
    default: {
      return state;
    }
  }
}

function LinkPageProvider({ children }) {
  const [linkPageState, dispatch] = useReducer(
    linkPageReducer,
    initialLinkPageState
  );

  return (
    <LinkPageContext value={linkPageState}>
      <LinkPageDispatchContext value={dispatch}>
        {children}
      </LinkPageDispatchContext>
    </LinkPageContext>
  );
}

export default LinkPageProvider;
