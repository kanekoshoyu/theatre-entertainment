import {Component, Inject, Input, OnInit, AfterViewInit} from "@angular/core";
import {MaxLengthValidator} from "@angular/forms";
import {StripeService} from "../../service/Stripe.service";
import {UtilService} from "../../service/Util.service";
import { TranslationService } from '../../service/Translation.service';

declare var jQuery: any;

@Component({
  selector: "card",
  template: require("raw-loader!./Card.html")
})

export class CardComponent implements OnInit {

  @Input() cardObj: Object;

  constructor(private stripeService: StripeService,  @Inject(TranslationService) private translationService: TranslationService) {
    this.translationService.setupTranslation("campaign_card");  
  }

  ngOnInit() {
    jQuery("input.cardNumber, input.cardExpiry, input.cardCVC").payment("restrictNumeric");
    jQuery("input.cardExpiry").payment("formatCardExpiry");
    jQuery("input.cardCVC").payment("formatCardCVC");
  }

  /**
   * Translate Function
   */
  translate(name){
    return TranslationService.translation[name];
  }

}
