'''
Test the UI using pylenium.
'''
import os
import time

import pytest
from selenium.common.exceptions import UnexpectedAlertPresentException

# The test port must be different than the production port.
PORT = int(os.environ.get('PORT', 8006))

# Local host cannot be used on all platforms.
# For example, in the github workflow actions, the
# ubuntu server does not to localhost mapping.
LOCALHOST = '127.0.0.1'


def test_tabs(py):
    '''
    Simple test to check the tabs.
    '''
    py.visit(f'http://{LOCALHOST}:{PORT}')
    assert py.find('#tabRaw')
    assert py.find('#tabRecords')
    assert py.find('#tabAdd')
    assert py.find('#tabEdit')
    assert py.find('#tabHelp')

    # Click on each element that works without JSON.
    py.find('#tabRaw')[0].click()
    py.find('#tabAdd')[0].click()
    py.find('#tabHelp')[0].click()

    # This simply did not work!
    # I have no idea why. The alert is correctly raised manually.
    ## We expect an alert from this because there is no JSON.
    #with pytest.raises(UnexpectedAlertPresentException):
    #    py.find('#tabRecords')[0].click()
    #    time.sleep(5)  # this is an absurdly long wait
    #py.find('#tabRaw')[0].click()


def test_raw_uloptions(py):
    '''
    Verify that the upload/download options select box works.
    '''
    py.visit(f'http://{LOCALHOST}:{PORT}')
    py.get('#ulOptionsSelect').select('dropbox')
    py.get('#ulOptionsSelect').select('file')
    py.get('#ulOptionsSelect').select('none')
    py.get('#ulOptionsSelect').select('url')

    # Also check the algorithm options.
    py.get('#algorithmSelect').select('qspm-aws-256-gcm')
    py.get('#algorithmSelect').select('qspm-aws-256-gcm-siv')


def test_raw_example(py):
    '''
    Test that the example can be created, encrypted, decrypted,
    compressed and formatted.
    '''
    py.visit(f'http://{LOCALHOST}:{PORT}')

    # Make sure that the example button generates what we expect.
    assert py.find('#tabRaw')
    assert py.find('#cryptExample')
    py.find('#cryptExample')[0].click()
    text = py.get('#cryptText').get_attribute('value')
    assert 'meta' in text

    # Now click on the password generation button.
    generate = None
    show = None
    buttons = py.get('#rawPasswordFieldset').find('button')
    for button in buttons:
        html = button.get_property('innerHTML')
        print(f'button: "{html}"')
        if html in ['Generate']:
            generate = button
        elif html in ['Show']:
            show = button
    assert show
    assert generate

    # Generate a password.
    generate.click()

    # Make sure that it is different each time.
    pw1 = py.find('#rawPasswordId')[0].get_attribute('value')
    generate.click()
    pw2 = py.find('#rawPasswordId')[0].get_attribute('value')
    generate.click()
    pw3 = py.find('#rawPasswordId')[0].get_attribute('value')
    assert pw1 != pw2
    assert pw1 != pw3
    assert pw2 != pw3

    # Verify that a master password was created.
    inp = py.find('#rawPasswordId')[0]
    text = inp.get_attribute('value')
    assert len(text) > 0
    print(f'password: {text}')

    # Verify that is can be shown and hidden.
    assert 'Show' == show.get_property('innerHTML')
    show.click()
    assert 'Hide' == show.get_property('innerHTML')
    show.click()
    assert 'Show' == show.get_property('innerHTML')

    # Encrypt/decrypt with the different algorithms.
    algorithms = ['qspm-aws-256-gcm', 'qspm-aws-256-gcm-siv']
    for algorithm in algorithms:
        print(f'algorithm: {algorithm}')
        py.get('#algorithmSelect').select(algorithm)

        # Encrypt.
        py.find('#encryptButton')[0].click()
        text = py.get('#cryptText').get_attribute('value')
        print('encrypt:\n' + text)
        assert '---------- qspm'  in text

        # Decrypt.
        py.find('#decryptButton')[0].click()
        assert len(text) > 0
        text = py.get('#cryptText').get_attribute('value')
        print('decrypt:\n' + text)
        assert '---------- qspm'  not in text

    # Compress.
    py.find('#cryptCompress')[0].click()
    assert len(text) > 0
    text = py.get('#cryptText').get_attribute('value')
    print('compress:\n' + text)
    assert '{"meta"'  in text

    # Format.
    py.find('#cryptFormat')[0].click()
    assert len(text) > 0
    text = py.get('#cryptText').get_attribute('value')
    print('format:\n' + text)
    assert '    "meta"'  in text

    # Size.
    py.find('#cryptTextSize')[0].click()
    assert len(text) > 0
    text = py.get('#cryptTextSizeValue').get_property('innerHTML').strip()
    print('size:\n' + text)
    assert text == '(2916)'
