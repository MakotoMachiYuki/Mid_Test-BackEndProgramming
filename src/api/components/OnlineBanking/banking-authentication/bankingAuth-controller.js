const bankingAuthService = require('./bankingAuth-service');
const { errorResponder, errorTypes } = require('../../../../core/errors');

/**
 * Handle login request
 * @param {object} request - Express request object
 * @param {object} response - Express response object
 * @param {object} next - Express route middlewares
 * @returns {object} Response object or pass an error to the next route
 */

async function accountlogin(request, response, next) {
  const { userName, password } = request.body;

  //initialize all the variables for recording the time right now
  const timeRightNow = new Date();
  const yearS = timeRightNow.getYear().toString().split(1);
  const year = parseInt(yearS[1]);
  const month = timeRightNow.getMonth();
  const date = timeRightNow.getDate();
  const hour = timeRightNow.getHours();
  const minutes = timeRightNow.getMinutes();
  const seconds = timeRightNow.getSeconds();
  const time = `[20${year}-${month}-${date} ${hour}:${minutes}:${seconds}]`;

  try {
    // Check login credentials
    const loginSuccess = await bankingAuthService.checkAccountLoginCredentials(
      userName,
      password,
      time
    );

    if (loginSuccess == 'PasswordWrong') {
      await bankingAuthService.checkAccountLoginTime(userName, time);
      const attemptDetail = await bankingAuthService.checkAccountLoginAttempt(
        userName,
        time
      );
      //when the attempts are below the limit attempt it will return the attempt count
      if (attemptDetail[0] == 'InvalidTry') {
        throw errorResponder(
          errorTypes.INVALID_PASSWORD,
          `${time} User ${userName} failed to login!. Attempt =  ${attemptDetail[1]}`
        );
      }
      //when the attempts reach the limit, it will return the minute left until the the user could try it again
      if (attemptDetail[0] == 'LimitReached') {
        throw errorResponder(
          errorTypes.INVALID_PASSWORD,
          `Limit Reached! Time left until you can try it again :) in ${attemptDetail[1]} minutes!`
        );
      }
      //when the timer is finished, but if the password is still wrong after the last lockout, it will return this message
      if (attemptDetail == 'AttemptReset') {
        throw errorResponder(
          errorTypes.INVALID_PASSWORD,
          'Your attempts are reseted! goodluck!'
        );
      }
    }
    //if there's no email recorded in the user database, it'll return message no invalid email
    if (loginSuccess == 'Noaccount') {
      throw errorResponder(
        errorTypes.INVALID_CREDENTIALS,
        'Invalid Username! Check your Username again!'
      );
    }

    return response.status(200).json(loginSuccess);
  } catch (error) {
    return next(error);
  }
}

module.exports = {
  accountlogin,
};
