package ch.bonomo.prisma;

import android.os.Bundle;
import androidx.core.view.WindowCompat;
import androidx.core.view.WindowInsetsCompat;
import androidx.core.view.WindowInsetsControllerCompat;
import com.getcapacitor.BridgeActivity;

/**
 * Prisma als Android-App (Ticket 10 von .scratch/umbau/): Capacitor zeigt das Spiel aus dist/ in einer WebView.
 * Vollbild (immersiv): Status- und Navigationsleiste aus; ein Wischen vom Rand holt sie kurz zurück, danach gehen sie
 * von selbst wieder weg. Nach jedem Zurückkommen in die App (Fokus, etwa aus dem Browser mit der Datenschutzerklärung)
 * wieder ausblenden. Die Abstände zu Kamera-Loch und Rändern regelt SystemBars (capacitor.config.json, insetsHandling
 * native), die Seite liest sie mit env(safe-area-inset-*). Zurück-Taste und Ton: im Spiel
 * (src/seite/geschichte/geschichte.js, zurueckTaste; src/seite/ton.js, visibilitychange).
 */
public class MainActivity extends BridgeActivity {

    @Override
    public void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        vollbild();
    }

    @Override
    public void onWindowFocusChanged(boolean hasFocus) {
        super.onWindowFocusChanged(hasFocus);
        if (hasFocus) vollbild();
    }

    private void vollbild() {
        WindowInsetsControllerCompat leisten = WindowCompat.getInsetsController(getWindow(), getWindow().getDecorView());
        leisten.setSystemBarsBehavior(WindowInsetsControllerCompat.BEHAVIOR_SHOW_TRANSIENT_BARS_BY_SWIPE);
        leisten.hide(WindowInsetsCompat.Type.systemBars());
    }
}
