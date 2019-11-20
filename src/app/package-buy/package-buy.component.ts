import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { CountriesListService } from '../services/countries-list.service';
import { FormGroup, FormBuilder, Validators } from '@angular/forms';

@Component({
  selector: 'app-package-buy',
  templateUrl: './package-buy.component.html',
  styleUrls: ['./package-buy.component.css']
})
export class PackageBuyComponent implements OnInit {

  buyerDetailsForm: FormGroup;

  packageCount: number = 1;
  packageAmount: number = 25;
  previousLicensePeriod: number = 1;
  licensePeriodAmount: number = 15;
  totalAmount: number = 0;
  selectedCard: number = 0;
  paymentTabNo: number = 0;
  invalidCardMonth: number = 0;
  invalidCardYear: number = 0;

  packageName: string = "";
  selectedCountry: string = "";

  isPersonalTabActive: boolean = true;
  isCompanyTabActive: boolean = false;
  invalidCountry: boolean = true;
  invalidCardCVV: boolean = false;
  invalidCardNo: boolean = false;

  // [just increase the value of this index, amount calculation will be done in function]
  licensePeriod = [1, 2, 3, 4, 5, 6];
  countriesList = [];


  constructor(private route: ActivatedRoute,
    private router: Router,
    private countryListService: CountriesListService,
    private formBuilder: FormBuilder) { }

  ngOnInit() {
    this.packageAmount = parseInt(this.route.snapshot.queryParams.packageInfo[1]);
    this.packageName = this.route.snapshot.queryParams.packageInfo[0];

    this.countriesList = this.countryListService.COUNTRY_NAMES;

    this.setFormDefaultVal();
    this.calcualteTotalAmount(this.packageAmount, this.licensePeriodAmount);
  }

  changePackageAmount(val) {
    if ((this.packageCount + val) < 1) return;
    if ((this.packageCount + val) > 7) return;

    this.packageCount += val;

    if (val < 0) { // decrement
      this.packageAmount -= 25;
    }
    else { // increment
      this.packageAmount += 25;
    }

    this.calcualteTotalAmount(this.licensePeriodAmount, this.packageAmount);
  }

  changeLicensePeriod(val) {
    let amountMoved = val - this.previousLicensePeriod;
    this.licensePeriodAmount += (15 * amountMoved);

    this.previousLicensePeriod = val;
    this.calcualteTotalAmount(this.licensePeriodAmount, this.packageAmount);
  }

  calcualteTotalAmount(licenseAmount, packageAmount) {
    this.totalAmount = licenseAmount + packageAmount;
  }

  paymentTabStatus(tabNo) {
    this.paymentTabNo = tabNo;

    if (this.paymentTabNo == 1) {
      setTimeout(() => {
        if (this.paymentTabNo != 1) return;
        window.location.href = 'https://www.paypal.com/us/home';
      }, 1000);
    }
  }

  billingTabStatus(tabNo) {
    if (tabNo == 1) {
      this.isCompanyTabActive = false;
      this.isPersonalTabActive = true;
    }
    else {
      this.isCompanyTabActive = true;
      this.isPersonalTabActive = false;
    }
  }

  changeCountry(country) {
    this.selectedCountry = country;

    if (this.selectedCountry != "Select Country") {
      this.invalidCountry = false;
    }
  }

  changeCard(cardNo) {
    this.selectedCard = cardNo;
  }

  validateCard(cardFormNo) {

    if (cardFormNo == 0) { // check card-Month field validation
      let convertMonthVal;
      if (this.buyerDetailsForm.get('cardExpiryMonth').value != null)
        convertMonthVal = (this.buyerDetailsForm.get('cardExpiryMonth').value + '').length;

      if (convertMonthVal == 2) this.invalidCardMonth = 0;
      else if (convertMonthVal == 1 || convertMonthVal > 2) this.invalidCardMonth = 1;
      else this.invalidCardMonth = 2;
    }

    else if (cardFormNo == 1) { // check card-Year field validation
      let convertYearVal;
      if (this.buyerDetailsForm.get('cardExpiryYear').value != null)
        convertYearVal = (this.buyerDetailsForm.get('cardExpiryYear').value + '').length;

      if (convertYearVal == 2) this.invalidCardYear = 0;
      else if (convertYearVal == 1 || convertYearVal > 2) this.invalidCardYear = 1;
      else this.invalidCardYear = 2;
    }

    else if (cardFormNo == 2) {
      let convertCodeVal = (this.buyerDetailsForm.get('cardCVV').value + '').length;

      if (convertCodeVal != 3) this.invalidCardCVV = true;
      else this.invalidCardCVV = false;
    }
  }

  validateCardNo() {
    let cardNoLength = (this.buyerDetailsForm.get('cardNumber').value + '').length;

    if (cardNoLength != 16) {
      this.invalidCardNo = true;
    }
    else {
      this.invalidCardNo = false;
    }
  }

  //   Validators.pattern('^[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+.[a-zA-Z0-9-.]+$')
  setFormDefaultVal() {
    this.buyerDetailsForm = this.formBuilder.group({
      email: ['', [Validators.required, Validators.email]],
      country: ['Select Country', [Validators.required]],
      address: ['', [Validators.required]],
      city: [''],
      zip: [''],
      company: ['', [Validators.required]],
      phone: [''],
      cardName: ['', [Validators.required]],
      cardNumber: ['', [Validators.required]],
      cardExpiryMonth: ['', [Validators.required]],
      cardExpiryYear: ['', [Validators.required]],
      cardCVV: ['', [Validators.required]]
    });

    this.selectedCountry = this.buyerDetailsForm.get('country').value;
  }

  submitDetails() {

  }

}
