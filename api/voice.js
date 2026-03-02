import twilio from "twilio";

export default function handler(req, res) {
  const { to } = req.query;

  const response = new twilio.twiml.VoiceResponse();

  response.dial({ callerId: process.env.TWILIO_NUMBER }, to);

  res.setHeader("Content-Type", "text/xml");
  res.send(response.toString());
}
