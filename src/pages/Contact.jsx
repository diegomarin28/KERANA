import { useRef } from "react";
import emailjs from '@emailjs/browser';
import { Button } from "../components/ui/Button";
import { Card } from "../components/ui/Card";

export default function Contact() {
    const form = useRef();

    const sendEmail = (e) => {
        e.preventDefault();
        emailjs
            .sendForm("service_dan74a5", "template_ueime5o", form.current, "DMO310micvFWXx-j4")
            .then(() => { alert("✅ Tu mensaje fue enviado con éxito!"); form.current.reset(); })
            .catch(() => alert("❌ Ocurrió un error al enviar el mensaje."));
    };

    return (
        <div style={{ maxWidth: 600, margin: "40px auto", padding: "20px" }}>
            <h1 style={{ textAlign: "center", marginBottom: 20 }}>Contacto</h1>
            <Card>
                <form ref={form} onSubmit={sendEmail} style={{ display: "grid", gap: 14 }}>
                    <label>Nombre</label>
                    <input type="text" name="name" required />

                    <label>Email</label>
                    <input type="email" name="email" required />

                    <label>Mensaje</label>
                    <textarea name="message" rows="5" required />

                    <Button type="submit" variant="secondary">Enviar</Button>
                </form>
            </Card>
        </div>
    );
}
