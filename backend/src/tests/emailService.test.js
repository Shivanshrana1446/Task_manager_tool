describe('emailService', () => {
  const ORIGINAL_ENV = { ...process.env };

  afterEach(() => {
    process.env = { ...ORIGINAL_ENV };
    jest.resetModules();
    jest.dontMock('nodemailer');
  });

  it('logs a dev-fallback link instead of sending mail when no SMTP transport is configured', async () => {
    delete process.env.SMTP_HOST;
    delete process.env.SMTP_USER;
    delete process.env.SMTP_PASS;
    jest.resetModules();

    const logger = require('../config/logger');
    jest.spyOn(logger, 'info').mockImplementation(() => {});

    const { sendPasswordResetEmail } = require('../services/emailService');
    await sendPasswordResetEmail({ to: 'ada@example.com', resetUrl: 'http://app.test/reset/tok' });

    expect(logger.info).toHaveBeenCalledWith(expect.stringContaining('ada@example.com'));
    expect(logger.info).toHaveBeenCalledWith(expect.stringContaining('http://app.test/reset/tok'));
  });

  it('sends a real email through nodemailer when SMTP is configured', async () => {
    process.env.SMTP_HOST = 'smtp.example.com';
    process.env.SMTP_USER = 'smtp-user';
    process.env.SMTP_PASS = 'smtp-pass';
    jest.resetModules();

    const sendMail = jest.fn().mockResolvedValue({ messageId: 'abc' });
    const createTransport = jest.fn().mockReturnValue({ sendMail });
    jest.doMock('nodemailer', () => ({ createTransport }));

    const { sendPasswordResetEmail } = require('../services/emailService');
    await sendPasswordResetEmail({ to: 'grace@example.com', resetUrl: 'http://app.test/reset/tok2' });

    expect(createTransport).toHaveBeenCalledWith(
      expect.objectContaining({ host: 'smtp.example.com', auth: { user: 'smtp-user', pass: 'smtp-pass' } })
    );
    expect(sendMail).toHaveBeenCalledWith(
      expect.objectContaining({ to: 'grace@example.com', subject: expect.any(String) })
    );
  });
});
