import React from 'react';
import { shallow, configure } from 'enzyme';
import Adapter from 'enzyme-adapter-react-16';

configure({adapter: new Adapter()});

import Detection from './Detection';

describe('HomePage component', () => {
    let wrapper;

    beforeEach(() => {
        wrapper = shallow(<Detection />);
        wrapper.setState({run: null});
    });

    it('should render without problem', () => {
        shallow(<Detection />);
    });

    it('should pause correctly', ()=>{
        wrapper.find('#stop-btn').simulate('click');
        expect(wrapper.state('run')).toBe(false);
    });

    it('should play correctly', ()=>{
        wrapper.find('#start-btn').simulate('click');
        expect(wrapper.state('run')).toBe(true);
    });

    it('should show an alert when the help button is clicked', ()=>{
        expect(wrapper.find('#alert-container').get(0).props.show).toBe(false);
        wrapper.find('#help-btn').simulate('click');
        expect(wrapper.state('help')).toBe(true);
        expect(wrapper.find('#alert-container').get(0).props.show).toBe(true);
    });
});