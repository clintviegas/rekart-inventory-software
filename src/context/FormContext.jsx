import { createContext, useContext, useReducer } from 'react';

const FormContext = createContext();

const initialState = {
  product: {},
  device: {},
  inventory: {},
  pricing: {},
  refurbishment: {},
  marketplace: {},
  activeSection: 'product',
};

function reducer(state, action) {
  switch (action.type) {
    case 'SET_SECTION':
      return { ...state, activeSection: action.payload };
    case 'UPDATE_FORM':
      return {
        ...state,
        [action.section]: { ...state[action.section], ...action.payload },
      };
    case 'RESET_FORM':
      return { ...state, [action.section]: {} };
    case 'RESET_ALL':
      return initialState;
    default:
      return state;
  }
}

export function FormProvider({ children }) {
  const [state, dispatch] = useReducer(reducer, initialState);
  return (
    <FormContext.Provider value={{ state, dispatch }}>
      {children}
    </FormContext.Provider>
  );
}

export function useFormContext() {
  return useContext(FormContext);
}
