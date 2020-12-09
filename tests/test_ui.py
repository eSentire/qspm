'''
Test the UI using pylenium.
'''
import inspect
import os

## Related to some sort pylenium issue.
##import pytest  # for pytest.raises()
##from selenium.common.exceptions import UnexpectedAlertPresentException

# The test port must be different than the production port.
PORT = int(os.environ.get('PORT', 8006))

# The localhost.
LOCALHOST = 'localhost'

# Define the URL used for the tests.
URL = f'http://{LOCALHOST}:{PORT}'


def debug(msg: str, level: int = 1):
    '''
    Print a debug message so that it can be seen.
    '''
    lineno = inspect.stack()[level].lineno
    fname = os.path.basename(inspect.stack()[level].filename)
    print(f'\x1b[35mDEBUG:{fname}:{lineno}: {msg}\x1b[0m')


def test_tabs(py):  # pylint: disable=invalid-name
    '''
    Simple test to check the tabs.
    '''
    debug(f'URL: {URL}')
    py.visit(URL)

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


def test_raw_uloptions(py):  # pylint: disable=invalid-name
    '''
    Verify that the upload/download options select box works.
    '''
    debug(f'URL: {URL}')
    py.visit(URL)
    py.get('#ulOptionsSelect').select('dropbox')
    py.get('#ulOptionsSelect').select('file')
    py.get('#ulOptionsSelect').select('none')
    py.get('#ulOptionsSelect').select('url')

    # Also check the algorithm options.
    py.get('#algorithmSelect').select('qspm-aws-256-gcm')
    py.get('#algorithmSelect').select('qspm-aws-256-gcm-siv')


def test_raw_example(py):  # pylint: disable=invalid-name,too-many-statements,too-many-locals
    '''
    Test that the example can be created, encrypted, decrypted,
    compressed and formatted.
    '''
    debug(f'URL: {URL}')
    py.visit(URL)

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
        debug(f'button: "{html}"')
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
    debug(f'password: {text}')

    # Verify that is can be shown and hidden.
    assert show.get_property('innerHTML') == 'Show'
    show.click()
    assert show.get_property('innerHTML') == 'Hide'
    show.click()
    assert show.get_property('innerHTML') == 'Show'

    # Encrypt/decrypt with all of the available algorithms.
    sel = py.get('#algorithmSelect')
    num = sel.get_property('length')
    for i in range(num):
        opt = sel.select(i)
        algorithm = opt.get_attribute('value')
        debug(f'algorithm: {algorithm}')
        py.get('#algorithmSelect').select(algorithm)

        # Encrypt.
        py.find('#encryptButton')[0].click()
        text = py.get('#cryptText').get_attribute('value')
        debug('encrypt:\n' + text)
        assert '---------- qspm'  in text

        # Decrypt.
        py.find('#decryptButton')[0].click()
        assert len(text) > 0
        text = py.get('#cryptText').get_attribute('value')
        debug('decrypt:\n' + text)
        assert '---------- qspm'  not in text

        # Encrypt again.
        py.find('#encryptButton')[0].click()
        text2 = py.get('#cryptText').get_attribute('value')
        debug('encrypt:\n' + text2)
        assert '---------- qspm'  in text2

        # Decrypt again.
        py.find('#decryptButton')[0].click()
        assert len(text) > 0
        text2 = py.get('#cryptText').get_attribute('value')
        debug('decrypt:\n' + text2)
        assert '---------- qspm'  not in text2

        # Make sure that the result is the same.
        assert text == text2

    # Compress.
    py.find('#cryptCompress')[0].click()
    assert len(text) > 0
    text = py.get('#cryptText').get_attribute('value')
    debug('compress:\n' + text)
    assert '{"meta"'  in text

    # Format.
    py.find('#cryptFormat')[0].click()
    assert len(text) > 0
    text = py.get('#cryptText').get_attribute('value')
    debug('format:\n' + text)
    assert '    "meta"'  in text

    # Size.
    py.find('#cryptTextSize')[0].click()
    assert len(text) > 0
    text = py.get('#cryptTextSizeValue').get_property('innerHTML').strip()
    debug('size:\n' + text)
    assert text == '(2916)'
