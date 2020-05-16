import React from 'react';
import { shallow, configure } from 'enzyme';
import Adapter from 'enzyme-adapter-react-16';

configure({adapter: new Adapter()});

import HomePage from './HomePage';

describe('HomePage component', () => {
    let wrapper;

    beforeEach(() => {
        wrapper = shallow(<HomePage />);
    });

    it('should render without problem', () => {
        shallow(<HomePage />);
    });

    it('should correctly convert FAQ object to cards', ()=>{
        wrapper.setState({cards: ['a','b','c','d','e','f'].map(item => {return {question: item, answer: item}})});

        expect(wrapper.find('.frequently-asked-container').length).toBe(6);
    });
});